import Product from "../models/productModel.js";
import HandleError from "./handleError.js";

const normalizeSizeKey = (value) => String(value || "").trim().toLowerCase();

const parseQuantity = (value) => {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return null;
    }
    return quantity;
};

const getNormalizedSizes = (product) =>
    Array.isArray(product?.sizes)
        ? product.sizes
            .map((size) => String(size || "").trim())
            .filter(Boolean)
        : [];

const getNormalizedSizePieces = (product) =>
    Array.isArray(product?.sizePieces)
        ? product.sizePieces
            .map((entry) => ({
                size: String(entry?.size || "").trim(),
                pieces: Number(entry?.pieces || 0),
            }))
            .filter((entry) => Boolean(entry.size))
        : [];

const resolveRequestedSize = (product, rawRequestedSize) => {
    const requestedSize = String(rawRequestedSize || "").trim();
    const availableSizes = getNormalizedSizes(product);
    const availableSizePieces = getNormalizedSizePieces(product);

    if (availableSizes.length > 0) {
        if (!requestedSize) {
            throw new HandleError(`Please select size for ${product.name}`, 400);
        }
        const matchedSize = availableSizes.find(
            (size) => normalizeSizeKey(size) === normalizeSizeKey(requestedSize)
        );
        if (!matchedSize) {
            throw new HandleError(`Invalid size selected for ${product.name}`, 400);
        }
        return matchedSize;
    }

    if (availableSizePieces.length > 0) {
        if (!requestedSize) {
            throw new HandleError(`Please select size for ${product.name}`, 400);
        }
        const matchedBySizePieces = availableSizePieces.find(
            (entry) => normalizeSizeKey(entry.size) === normalizeSizeKey(requestedSize)
        );
        if (!matchedBySizePieces) {
            throw new HandleError(`Invalid size selected for ${product.name}`, 400);
        }
        return matchedBySizePieces.size;
    }

    return requestedSize;
};

const rollbackReservations = async (appliedReservations = []) => {
    for (let i = appliedReservations.length - 1; i >= 0; i -= 1) {
        const reservation = appliedReservations[i];
        const query = { _id: reservation.productId };
        const update = reservation.usedSizePieces
            ? {
                $inc: {
                    stock: Number(reservation.quantity || 0),
                    "sizePieces.$[sizeEntry].pieces": Number(reservation.quantity || 0),
                },
            }
            : {
                $inc: {
                    stock: Number(reservation.quantity || 0),
                },
            };
        const options = reservation.usedSizePieces
            ? { arrayFilters: [{ "sizeEntry.size": reservation.size }] }
            : undefined;

        try {
            await Product.updateOne(query, update, options);
        } catch (error) {
            console.warn("Inventory rollback failed:", error.message);
        }
    }
};

export const reserveInventoryForOrderItems = async (orderItems = []) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new HandleError("Order has no items to reserve inventory for", 400);
    }

    const appliedReservations = [];
    const normalizedOrderItems = [];

    for (const item of orderItems) {
        const productId = String(item?.product || "").trim();
        const quantity = parseQuantity(item?.quantity);

        if (!productId) {
            await rollbackReservations(appliedReservations);
            throw new HandleError("Invalid product in order items", 400);
        }
        if (!quantity) {
            await rollbackReservations(appliedReservations);
            throw new HandleError("Each order item must have a valid quantity", 400);
        }

        const product = await Product.findById(productId)
            .select("name stock sizes sizePieces");

        if (!product) {
            await rollbackReservations(appliedReservations);
            throw new HandleError("One or more products are unavailable", 404);
        }

        const normalizedSize = resolveRequestedSize(product, item?.size);
        const sizePiecesEntries = getNormalizedSizePieces(product);
        const matchedSizeEntry = normalizedSize
            ? sizePiecesEntries.find(
                (entry) => normalizeSizeKey(entry.size) === normalizeSizeKey(normalizedSize)
            )
            : null;

        let updateResult;
        if (matchedSizeEntry) {
            updateResult = await Product.updateOne(
                {
                    _id: product._id,
                    stock: { $gte: quantity },
                    sizePieces: {
                        $elemMatch: {
                            size: matchedSizeEntry.size,
                            pieces: { $gte: quantity },
                        },
                    },
                },
                {
                    $inc: {
                        stock: -quantity,
                        "sizePieces.$[sizeEntry].pieces": -quantity,
                    },
                },
                {
                    arrayFilters: [{ "sizeEntry.size": matchedSizeEntry.size }],
                }
            );
        } else {
            updateResult = await Product.updateOne(
                {
                    _id: product._id,
                    stock: { $gte: quantity },
                },
                {
                    $inc: {
                        stock: -quantity,
                    },
                }
            );
        }

        if (!updateResult?.modifiedCount) {
            await rollbackReservations(appliedReservations);
            if (matchedSizeEntry) {
                throw new HandleError(
                    `Insufficient stock for size ${normalizedSize} in ${product.name}`,
                    400
                );
            }
            throw new HandleError(`Insufficient stock for ${product.name}`, 400);
        }

        appliedReservations.push({
            productId: product._id,
            quantity,
            size: matchedSizeEntry?.size || normalizedSize,
            usedSizePieces: Boolean(matchedSizeEntry),
        });

        normalizedOrderItems.push({
            ...item,
            quantity,
            size: normalizedSize,
            product: product._id,
        });
    }

    return normalizedOrderItems;
};

export const releaseInventoryForOrderItems = async (orderItems = []) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return;
    }

    for (const item of orderItems) {
        const productId = String(item?.product || "").trim();
        const quantity = parseQuantity(item?.quantity);
        if (!productId || !quantity) {
            continue;
        }

        const rawSize = String(item?.size || "").trim();
        if (!rawSize) {
            await Product.updateOne(
                { _id: productId },
                { $inc: { stock: quantity } }
            );
            continue;
        }

        const product = await Product.findById(productId).select("sizePieces");
        const sizeEntry = getNormalizedSizePieces(product).find(
            (entry) => normalizeSizeKey(entry.size) === normalizeSizeKey(rawSize)
        );

        if (sizeEntry) {
            await Product.updateOne(
                { _id: productId },
                {
                    $inc: {
                        stock: quantity,
                        "sizePieces.$[sizeEntry].pieces": quantity,
                    },
                },
                { arrayFilters: [{ "sizeEntry.size": sizeEntry.size }] }
            );
            continue;
        }

        await Product.updateOne(
            { _id: productId },
            { $inc: { stock: quantity } }
        );
    }
};
