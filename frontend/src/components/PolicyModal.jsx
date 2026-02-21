import React, { useEffect } from "react";
import { IoCloseOutline } from "react-icons/io5";
import "../componentStyles/PolicyModal.css";

export default function PolicyModal({ isOpen, onClose, title, children }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="policy-modal-overlay" onClick={onClose}>
      <div
        className="policy-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="policy-modal-header">
          <h2 className="policy-modal-title">{title}</h2>
          <button
            className="policy-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="policy-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── Policy content components ─── */

export function TermsAndConditions() {
  return (
    <div className="policy-content">
      <p>
        Welcome to iraguforher.com. By using our website, you agree to comply
        with and be legally bound by the following Terms and Conditions. Please
        read them carefully before making any purchases.
      </p>

      <h3>1. General</h3>
      <p>
        This website is owned and operated by Saranya M, Shop Located in No.
        78/53, ECR Road, Near SBI Bank, Thiruvanmiyur, Chennai-600041.
      </p>
      <p>
        By accessing or using this website, you acknowledge that you have read,
        understood, and agree to be bound by these Terms and Conditions and all
        applicable laws.
      </p>

      <h3>2. Products &amp; Pricing</h3>
      <ul>
        <li>
          All products listed on the website are subject to availability.
        </li>
        <li>
          We reserve the right to change prices, product descriptions, and
          specifications at any time without prior notice.
        </li>
        <li>
          Shipping charges and any additional fees will be shown at checkout.
        </li>
      </ul>

      <h3>3. Orders</h3>
      <ul>
        <li>
          Orders are accepted via our secure checkout process. Once placed, you
          will receive a confirmation email.
        </li>
        <li>
          IRAGU FOR HER reserves the right to cancel or refuse any order at our
          discretion, including in cases of pricing errors or suspected fraud.
        </li>
      </ul>

      <h3>4. Payment</h3>
      <ul>
        <li>
          We accept payments through secure gateways such as PhonePe UPI,
          credit/debit cards, and other methods displayed at checkout.
        </li>
        <li>
          All payment information is processed securely and confidentially.
        </li>
      </ul>

      <h3>5. Shipping &amp; Delivery</h3>
      <ul>
        <li>We currently ship across India.</li>
        <li>
          For International shipping please contact +91 9042991048.
        </li>
        <li>Orders are processed within 1–3 business days.</li>
        <li>
          Delivery typically takes 5–10 business days, depending on your
          location.
        </li>
        <li>
          Products listed as pre-order items will be delivered within 20 to 30
          days from the date of purchase.
        </li>
        <li>
          Customized or made-to-order items may require additional processing
          time.
        </li>
        <li>
          While we strive for timely delivery, delays may occur due to
          unforeseen circumstances.
        </li>
      </ul>

      <h3>6. Returns &amp; Exchanges</h3>

      <h4>Return Eligibility</h4>
      <ul>
        <li>
          Returns are accepted only for defective, damaged, or incorrect items.
        </li>
        <li>
          An unboxing/opening video is mandatory as proof. The video must clearly
          show the package being opened and the issue at the time of delivery.
        </li>
        <li>
          Return requests must be initiated within 48 hours of delivery.
        </li>
        <li>
          Items must be unused, unwashed, and returned in their original
          packaging with all tags intact.
        </li>
      </ul>

      <h4>Non-Returnable Items</h4>
      <ul>
        <li>Customized or made-to-order garments.</li>
        <li>
          Items purchased on sale or through promotional offers, unless damaged.
        </li>
      </ul>

      <h4>Exchange &amp; Refund Policy</h4>
      <ul>
        <li>
          Once your return is approved, we will deliver a replacement or exchange
          within 5–10 business days.
        </li>
        <li>Cash refunds are not applicable.</li>
        <li>
          We offer a one-time size exchange, subject to stock availability.
        </li>
        <li>
          Size exchange requests also require an opening video and must be raised
          within 48 hours of delivery.
        </li>
      </ul>

      <h4>Return Process</h4>
      <ul>
        <li>
          Email or WhatsApp us with your order number, a brief description of
          the issue, and the unboxing video.
        </li>
        <li>
          Once approved, guide you through the return shipping steps.
        </li>
        <li>
          Replacements will be processed within 7–10 business days after
          receiving the returned item.
        </li>
      </ul>

      <h3>7. Intellectual Property</h3>
      <p>
        All content on this website, including images, designs, logos, and text,
        is the property of Iragu For Her and protected under applicable copyright
        laws.
      </p>
      <p>
        Reproduction or distribution of our content without prior written
        permission is strictly prohibited.
      </p>

      <h3>8. User Conduct</h3>
      <p>
        You agree not to misuse the website, including attempts to disrupt the
        service, upload malicious code, or violate the rights of others.
      </p>

      <h3>9. Privacy Policy</h3>
      <p>
        Your personal data is protected as per our Privacy Policy. We do not sell
        or share your information with third parties without your consent.
      </p>

      <h3>10. Limitation of Liability</h3>
      <p>
        IRAGU FOR HER is not liable for any indirect, incidental, or
        consequential damages arising from the use of our website or products.
      </p>

      <h3>11. Changes to Terms</h3>
      <p>
        We may update these Terms and Conditions at any time. Changes will be
        posted on this page, and your continued use of the site constitutes
        acceptance of the updated terms.
      </p>

      <p>.</p>

      <p>
        These Terms of Service and any separate agreements whereby we provide you
        Services shall be governed by and construed in accordance with the laws
        of India.
      </p>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <div className="policy-content">
      <p>
        At iraguforher.com, we value your privacy and are committed to
        protecting the personal information you share with us. This policy
        explains how we collect, use, and safeguard your data when you visit or
        make a purchase from our website.
      </p>

      <h3>1. Information We Collect</h3>
      <p>We collect the following types of information:</p>
      <ul>
        <li>
          <strong>Personal Information:</strong> Your name, address, phone
          number, email ID, and payment details during checkout or when you
          register an account.
        </li>
        <li>
          <strong>Order Details:</strong> Purchase history, delivery preferences,
          and order-related communication.
        </li>
        <li>
          <strong>Device Information:</strong> IP address, browser type, pages
          visited, and cookies used for website analytics and improvements.
        </li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <p>Your information is used to:</p>
      <ul>
        <li>Process and fulfill your orders.</li>
        <li>
          Communicate order updates, shipping notifications, and provide customer
          support.
        </li>
        <li>Improve our website functionality and product offerings.</li>
        <li>Send promotional emails (you may opt out at any time).</li>
        <li>
          Prevent fraudulent transactions and ensure site security.
        </li>
      </ul>

      <h3>3. Sharing Your Information</h3>
      <p>
        We do not sell, trade, or rent your personal information. However, we may
        share it with:
      </p>
      <ul>
        <li>
          Third-party service providers (such as payment processors and delivery
          partners) who support our website's operations.
        </li>
        <li>Government authorities, if legally required.</li>
      </ul>
      <p>
        All data shared is protected under strict confidentiality agreements.
      </p>

      <h3>4. Cookies</h3>
      <p>iraguforher.com uses cookies to:</p>
      <ul>
        <li>Store your preferences for a better shopping experience.</li>
        <li>Analyze traffic and website usage.</li>
        <li>
          Enhance functionality and personalize your browsing experience.
        </li>
      </ul>
      <p>You can manage or disable cookies through your browser settings.</p>

      <h3>5. Data Security</h3>
      <p>
        We implement strong security measures to protect your personal data. Our
        website uses SSL encryption and secure payment gateways to keep your
        information safe.
      </p>

      <h3>6. Your Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>
          Request a copy of the personal data we hold about you.
        </li>
        <li>
          Access, update, or request deletion of your personal information.
        </li>
        <li>
          Opt out of receiving marketing communications at any time.
        </li>
      </ul>
    </div>
  );
}

export function ShippingAndReturnsPolicy() {
  return (
    <div className="policy-content">
      <p>
        At (Ex.iraguforher.com), we are committed to delivering high-quality
        product with a seamless shopping experience. Please review our shipping
        and returns policies below.
      </p>

      <h3>Shipping Policy</h3>

      <h4>Delivery Locations</h4>
      <ul>
        <li>We currently ship across India.</li>
        <li>
          For International shipping please contact +91 9042991048.
        </li>
      </ul>

      <h4>Shipping Time</h4>
      <ul>
        <li>Orders are processed within 1–3 business days.</li>
        <li>
          Delivery typically takes 5–10 business days, depending on your
          location.
        </li>
        <li>
          Products listed as pre-order items will be delivered within 20 to 30
          days from the date of purchase.
        </li>
        <li>
          Customized or made-to-order items may require additional processing
          time.
        </li>
      </ul>

      <h4>Order Tracking</h4>
      <ul>
        <li>
          A tracking details will be shared via Whatsapp or email or SMS once
          your order is dispatched.
        </li>
        <li>
          You can also check your order status by logging into your account
          dashboard.
        </li>
      </ul>

      <h3>Return, Refund &amp; Exchange Policy</h3>
      <p>
        All products are thoroughly inspected before shipping. However, if you
        receive a damaged, defective, or incorrect item, we&apos;re here to help.
      </p>

      <h4>Return Eligibility</h4>
      <p>
        All our products are handcrafted by traditional craft persons in rural
        India, resulting in each product being unique and slightly different
        from each other.
      </p>
      <p>
        An irregular weave or print or a stitch should not be taken as a defect
        as handcrafted products will not show consistent uniformity like a
        machine-made product. Handloom, by definition, means a glorious
        uncertainty when it comes to uniformity and we stand behind the quality
        of our products
      </p>
      <ul>
        <li>
          Returns are accepted only for defective, damaged, or incorrect items.
        </li>
        <li>
          An unboxing/opening video is mandatory as proof. The video must clearly
          show the package being opened and the issue at the time of delivery.
        </li>
        <li>
          Return requests must be initiated within 48 hours of delivery.
        </li>
        <li>
          Items must be unused, unwashed, and returned in their original
          packaging with all tags intact.
        </li>
      </ul>

      <h4>Non-Returnable Items</h4>
      <ul>
        <li>Customized or made-to-order garments.</li>
        <li>
          Items purchased on sale or through promotional offers, unless damaged.
        </li>
      </ul>

      <h4>Exchange &amp; Refund Policy</h4>
      <ul>
        <li>
          Once your return is approved, we will deliver a replacement or exchange
          within 5–10 business days.
        </li>
        <li>Cash refunds are not applicable.</li>
        <li>
          We offer a one-time size exchange, subject to stock availability.
        </li>
        <li>
          Size exchange requests also require an opening video and must be raised
          within 48 hours of delivery.
        </li>
      </ul>

      <h4>Return Process</h4>
      <ul>
        <li>
          Email or WhatsApp us with your order number, a brief description of
          the issue, and the unboxing video.
        </li>
        <li>
          Once approved, guide you through the return shipping steps.
        </li>
        <li>
          Replacements will be processed within 7–10 business days after
          receiving the returned item.
        </li>
      </ul>
    </div>
  );
}
