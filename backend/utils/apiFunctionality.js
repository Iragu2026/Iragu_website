class ApiFunctionality {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    // Search by keyword in both name AND description
    search() {
        const keyword = this.queryStr.keyword
            ? {
                  $or: [
                      { name: { $regex: this.queryStr.keyword, $options: "i" } },
                      { description: { $regex: this.queryStr.keyword, $options: "i" } },
                  ],
              }
            : {};
        this.query = this.query.find({ ...keyword });
        return this;
    }

    // Filter with support for MongoDB operators (price[gte]=500 → price: { $gte: 500 })
    // Also handles boolean flags and exact-match fields
    filter() {
        const queryCopy = { ...this.queryStr };

        // Fields to exclude from direct filtering
        const removeFields = ["keyword", "page", "limit", "sort", "subCategory", "occasion", "fabric", "color", "size"];
        removeFields.forEach((field) => delete queryCopy[field]);

        // Handle subCategory as a regex match (partial, case-insensitive)
        if (this.queryStr.subCategory) {
            this.query = this.query.find({
                subCategory: { $regex: this.queryStr.subCategory, $options: "i" },
            });
        }

        // Handle fabric as a regex match (partial, case-insensitive)
        if (this.queryStr.fabric) {
            this.query = this.query.find({
                fabric: { $regex: this.queryStr.fabric, $options: "i" },
            });
        }

        // Handle color as a regex match on colors.name (case-insensitive)
        if (this.queryStr.color) {
            this.query = this.query.find({
                "colors.name": { $regex: this.queryStr.color, $options: "i" },
            });
        }

        // Handle occasion as an array match ($in)
        if (this.queryStr.occasion) {
            const occasions = this.queryStr.occasion.split(",").map((o) => o.trim());
            this.query = this.query.find({
                occasion: { $in: occasions.map((o) => new RegExp(o, "i")) },
            });
        }

        // Handle size as an array match on sizes ($in)
        // Accepts comma-separated sizes: size=XS,S,M
        if (this.queryStr.size) {
            const sizes = this.queryStr.size
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => s.toUpperCase());
            if (sizes.length > 0) {
                const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                // Use case-insensitive exact-match regexes to be robust against casing differences
                const sizeRegexes = sizes.map((s) => new RegExp(`^${escapeRegExp(s)}$`, "i"));
                this.query = this.query.find({
                    sizes: { $in: sizeRegexes },
                });
            }
        }

        // Convert boolean-like strings to actual booleans
        const booleanFields = ["isNewArrival", "isBestSeller", "isFeatured", "isOffer"];
        booleanFields.forEach((field) => {
            if (queryCopy[field] !== undefined) {
                queryCopy[field] = queryCopy[field] === "true";
            }
        });

        // Convert operators: gte → $gte, lte → $lte, gt → $gt, lt → $lt
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    // Sort results
    sort() {
        if (this.queryStr.sort) {
            switch (this.queryStr.sort) {
                case "price_asc":
                    this.query = this.query.sort({ price: 1 });
                    break;
                case "price_desc":
                    this.query = this.query.sort({ price: -1 });
                    break;
                case "newest":
                    this.query = this.query.sort({ createdAt: -1 });
                    break;
                case "ratings":
                    this.query = this.query.sort({ ratings: -1 });
                    break;
                case "best_selling":
                    this.query = this.query.sort({ isBestSeller: -1, ratings: -1 });
                    break;
                default:
                    break;
            }
        }
        return this;
    }

    // Paginate results
    pagination(resultsPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resultsPerPage * (currentPage - 1);
        this.query = this.query.limit(resultsPerPage).skip(skip);
        return this;
    }
}

export default ApiFunctionality;
