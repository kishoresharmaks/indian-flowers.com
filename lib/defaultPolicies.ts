export interface DefaultPolicyData {
  slug: string;
  title: string;
  subtitle: string;
  category: 'legal' | 'shipping' | 'compliance' | 'general';
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  metaDescription: string;
  isPublished: boolean;
  order: number;
}

export const DEFAULT_POLICIES: DefaultPolicyData[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'How Indian-Flowers.com collects, safeguards, and respects your personal information under United States federal and state privacy frameworks (including California CCPA/CPRA).',
    category: 'legal',
    effectiveDate: 'October 15, 2026',
    lastUpdated: 'October 15, 2026',
    metaDescription: 'Read the official Privacy Policy for Indian-Flowers.com. Learn how we protect customer data, secure payments via Razorpay, and uphold US consumer privacy rights.',
    isPublished: true,
    order: 1,
    content: `## 1. Introduction & Overview

Welcome to **Indian-Flowers.com** ("we," "our," "us"). We are committed to protecting the privacy, confidentiality, and security of our visitors and customers across the United States. This Privacy Policy details our practices concerning the collection, use, disclosure, and protection of personal information when you browse our storefront, communicate with our floral concierge, place orders for fresh blossoms and ceremonial garlands, or use our digital services.

This policy has been designed in strict accordance with United States federal and state privacy laws, including the **California Consumer Privacy Act (CCPA)**, as amended by the **California Privacy Rights Act (CPRA)**, Virginia's Consumer Data Protection Act (VCDPA), Colorado Privacy Act (CPA), and other applicable US state consumer protection standards.

---

## 2. Information We Collect

We collect only the personal information strictly necessary to provide authentic, temperature-controlled floral deliveries and exceptional customer care.

### A. Information You Provide Directly
* **Contact & Identification Data:** Your full legal name, telephone number (for delivery status SMS/WhatsApp updates), and email address.
* **US Delivery Address:** Complete physical shipping address including street address, apartment/suite number, city, two-letter US state code, and 5- or 9-digit US ZIP code. *(Please note: We do not ship perishable fresh flora to P.O. Boxes).*
* **Order & Celebration Details:** Information regarding custom ceremonial dates (wedding muhurtham dates, temple puja schedules), garland custom length requests, and personalized floral gift notes.
* **Customer Support Communications:** Records and correspondence when you contact our US support team via email, chat, or phone.

### B. Payment Information & Gateway Disclosures
* All storefront orders on Indian-Flowers.com are billed exclusively in **United States Dollars (USD, $)**.
* Online card payments are securely facilitated by our PCI-DSS Level 1 certified gateway partner, **Razorpay International**, and affiliated US banking networks.
* **Important:** Indian-Flowers.com **never stores or retains complete credit card numbers, debit card numbers, or CVV security codes** on our servers. All card data is transmitted via 256-bit SSL encryption directly to the tokenized payment gateway. We retain only non-sensitive transaction identifiers (such as the Razorpay Payment ID, payment method type, and timestamp) for accounting and receipt verification.

### C. Automatically Collected Technical Data
* **Device & Usage Identifiers:** IP address, browser type and version, operating system, referring URL, pages viewed, time spent on site, and crash diagnostic logs.
* **Shopping Cart Persistence:** Client-side local storage tokens used exclusively to remember your selected blooms, quantities, and wishlist between visits.

---

## 3. How We Use Your Information

We process personal information under legitimate business purposes and customer fulfillment agreements:
1. **Cold-Chain Order Fulfillment:** Routing, dispatching, and tracking perishable floral parcels via express carriers (such as FedEx Priority Overnight and UPS Next Day Air).
2. **Statutory US Sales Tax Compliance:** Determining precise destination-based sales tax for your state, county, and local municipal tax jurisdictions.
3. **Customer Support & Service Alerts:** Sending immediate order confirmation receipts, shipment dispatch tracking links, and real-time delivery notifications.
4. **Fraud Prevention & Security:** Protecting our customers and business against unauthorized card transactions, bot abuse, and security vulnerabilities.
5. **Continuous Platform Optimization:** Analyzing aggregated, anonymized metrics to enhance catalog speed, navigational ease, and floral availability.

---

## 4. How We Share Your Information

**We do not sell, rent, lease, or monetize your personal information to third parties for commercial advertising.** We share data solely with trusted service providers essential to completing your order:
* **Logistics & Delivery Carriers:** FedEx, UPS, and temperature-controlled courier partners who require recipient names, delivery addresses, and phone numbers to complete morning deliveries.
* **Payment Processors:** Razorpay International and merchant banking partners to authorize and settle card transactions.
* **State & Federal Tax Authorities:** Aggregated transaction logs necessary to satisfy US state sales tax compliance and corporate financial reporting.
* **Legal Requirements:** If required by law, subpoena, court order, or governmental audit, or to protect the safety, rights, and property of our customers and store.

---

## 5. Your Rights Under US State Laws (CCPA / CPRA & Other States)

If you are a resident of California or states with comparable consumer privacy frameworks, you have specific statutory rights:
* **Right to Know / Access:** You may request details about the categories and specific pieces of personal information we have collected about you over the past 12 months.
* **Right to Delete:** You may request the deletion of personal information we collected directly from you, subject to legal exceptions (such as retaining tax and transaction records).
* **Right to Correct:** You have the right to request correction of inaccurate personal information in our records.
* **Right to Non-Discrimination:** We will never deny services, charge different prices, or provide a lower quality of service because you exercised your statutory privacy rights.
* **Right to Opt-Out of Sale or Sharing:** We do not sell or share personal data for cross-context behavioral advertising.

To exercise any of these rights, please email our privacy team at **privacy@indian-flowers.com** with the subject line *"US Privacy Rights Request"*.

---

## 6. Data Security & Storage Integrity

We maintain administrative, technical, and physical safeguards designed to protect personal information against accidental loss, unauthorized access, and alteration:
* Full site-wide **256-Bit Transport Layer Security (TLS/SSL)** encryption on all customer interactions and checkout flows.
* Encrypted database storage with strictly segregated, authenticated administrative access.
* Regular security reviews and compliance verification against modern e-commerce benchmarks.

---

## 7. Children's Online Privacy (COPPA Compliance)

Indian-Flowers.com is intended exclusively for adult consumers organizing wedding, religious, cultural, and household floral celebrations. In accordance with the **Children's Online Privacy Protection Act (COPPA)**, we do not knowingly solicit or collect personal information from individuals under 13 years of age.

---

## 8. Updates to This Privacy Policy

We may update this Privacy Policy periodically to reflect changes in our operational procedures, shipping carrier integrations, or US privacy regulations. When updates occur, the "Last Updated" date at the top of this document will be revised immediately.

---

## 9. Contact Our Data Privacy Officer

If you have questions, feedback, or formal privacy inquiries regarding our compliance or data handling:
* **Email:** indianflowersorder@gmail.com
* **Customer Concierge:** indianflowersorder@gmail.com
* **Telephone:** +1 (909) 379-3678
* **Mailing Address:** The Indian Flowers, 14922 Bobcat lane, Fontana, CA 92336, California, USA`
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping & Delivery Policy',
    subtitle: 'Freshness-guaranteed cold-chain delivery of authentic Indian blossoms, wedding garlands, and sacred puja leaves across the United States.',
    category: 'shipping',
    effectiveDate: 'October 15, 2026',
    lastUpdated: 'October 15, 2026',
    metaDescription: 'Read the official USA Shipping & Delivery Policy for Indian-Flowers.com. Learn about our cold-chain overnight shipping, morning delivery guarantees, and packaging standards.',
    isPublished: true,
    order: 2,
    content: `## 1. Our Commitment to Floral Dewiness & Freshness

Fresh Indian flowers—including fragrant Madurai Jasmine strands (*Mallipoo*), sacred Lotus blooms, fresh Marigolds (*Genda*), auspicious Mango leaf thoranams, and ceremonial bridal Jai Malas—are fragile, living agricultural treasures. We have engineered a specialized **Cold-Chain Express Logistics System** to ensure blooms arrive fresh, dewy, and fragrant anywhere in the United States.

---

## 2. Delivery Coverage Across the United States

* **Contiguous 48 States:** We provide express overnight delivery to residential, temple, banquet hall, and hotel destinations across all 48 contiguous US states.
* **Alaska & Hawaii:** Deliveries to Alaska and Hawaii require specialized air-cargo arrangements. Please contact our support team at **indianflowersorder@gmail.com** at least 7 days in advance to coordinate routing.
* **P.O. Boxes & APO/FPO:** Because our floral shipments contain living, perishable botanical items requiring immediate care, **we cannot ship to P.O. Boxes, APO/FPO military addresses, or unstaffed parcel lockers.** A physical street address is mandatory for all orders.

---

## 3. Shipping Carriers & Express Methods

To minimize transit time and protect freshness, all orders are dispatched via trusted Tier-1 express air carriers:
* **FedEx Priority Overnight:** Guaranteed arrival by 10:30 AM to 12:00 PM in most metropolitan US zones.
* **UPS Next Day Air:** Next-morning delivery to commercial and residential destinations nationwide.
* **Temperature-Controlled Courier Networks:** Dedicated cold-van couriers deployed for high-volume wedding Jai Mala parcels in select metropolitan corridors.

Tracking numbers and automated carrier status alerts are emailed as soon as your floral parcel is inspected, packed, and tendered to the air carrier.

---

## 4. Temperature-Controlled Packaging Standards

Every parcel is prepared with institutional cold-chain packaging:
1. **Insulated Thermal Liners:** Custom metallic insulation reflects external ambient heat and holds interior chill.
2. **Food-Grade Non-Toxic Gel Refrigerants:** Specialized frozen gel packs keep inner compartment temperatures between 38°F and 46°F (3°C to 8°C).
3. **Breathable Protective Wraps:** Flowers are swaddled in natural moisture-wicking botanical paper to prevent condensation while allowing petals to breathe.
4. **Cushioned Anti-Crush Boxing:** Sturdy double-walled corrugated outer cartons protect delicate garlands and blossoms against transit vibration.

---

## 5. Order Cutoff Times & Scheduling

| Order Category | Order Cutoff (Pacific Time) | Delivery Timelines |
| :--- | :--- | :--- |
| **Loose Flowers & Daily Pooja Blooms** | 2:00 PM PST (Mon – Thu) | Next-Day Morning Delivery |
| **Sacred Leaves (Betel, Mango, Banana)** | 2:00 PM PST (Mon – Thu) | Next-Day Morning Delivery |
| **Ceremonial Garlands (Jai Mala / Weddings)** | 5 Business Days in Advance | Scheduled Morning of Muhurtham / Event |
| **Weekend Event Orders (Sat / Sun Muhurthams)** | Friday Morning Dispatch | Saturday Morning Guaranteed Arrival |

*Note: For Sunday ceremonies, we recommend selecting **Friday dispatch for Saturday delivery**, then placing flowers in a standard home refrigerator (crisper drawer) overnight to ensure maximum peace of mind on your ceremony morning.*

---

## 6. Festival Peak Season Recommendations

During auspicious Hindu festival seasons—such as **Diwali, Navratri, Varalakshmi Vratham, Ganesh Chaturthi, Krishna Janmashtami, and Ugadi**—national air carrier volume increases drastically across the United States. We strongly advise placing orders **7 to 10 days in advance** to guarantee floral harvesting and reservation of cold-chain flight space.

---

## 7. Recipient Responsibility Upon Delivery

Because cut flowers and puja leaves are natural perishable products:
* **Immediate Retrieval:** The recipient or designated family member must bring the package indoors immediately upon carrier drop-off.
* **Avoid Sunlight & Porch Heat:** Leaving fresh flora on sunlit porches, patios, or in metal parcel lockboxes will degrade delicate jasmine and rose petals rapidly.
* **Unboxing & Storage:** Open the box, inspect your flowers, and transfer them into a clean, sealed container lined with dry paper towels in your refrigerator crisper drawer until puja or wedding time.

---

## 8. Weather Delays & Force Majeure

While our dispatch timing and packaging are rigorously calculated, severe weather phenomena (such as blizzards, hurricanes, tornado alerts, or FAA air traffic control ground stops) may occasionally impact air cargo hubs. In such extraordinary events, we coordinate proactively with the carrier and notify you immediately with updated transit projections.`
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    subtitle: 'Binding legal agreement governing your use of Indian-Flowers.com, storefront purchases, and ceremonial floral orders within the United States.',
    category: 'legal',
    effectiveDate: 'October 15, 2026',
    lastUpdated: 'October 15, 2026',
    metaDescription: 'Review the complete Terms and Conditions of Indian-Flowers.com. Understand order agreements, pricing in USD, floral agricultural variations, and US legal governance.',
    isPublished: true,
    order: 3,
    content: `## 1. Agreement to Terms

By accessing, browsing, or placing an order on **Indian-Flowers.com** ("Site," "Store," "we," "us"), you ("Customer," "User," "you") enter into a legally binding agreement governed by the laws of the **State of California** and applicable federal laws of the **United States of America**. If you do not agree with all provisions of these Terms and Conditions, you must refrain from using the Site and purchasing our products.

---

## 2. US Market Scope & Currency

* **Currency of Record:** All transactions, prices, shipping fees, discounts, and sales tax calculations displayed on Indian-Flowers.com are denominated strictly in **United States Dollars (USD, $)**.
* **Jurisdiction:** Indian-Flowers.com is organized and operated to serve retail, temple, cultural, and wedding floral customers residing within the United States.

---

## 3. Account & Order Acceptance

* **Order Verification:** An order receipt or electronic order confirmation does not constitute our final acceptance of an order. We reserve the right to verify credit card authentication with our payment gateway, confirm address deliverability with carriers, and check harvest availability before confirming dispatch.
* **Accurate Information:** You agree to provide accurate, complete, and current contact, delivery, and billing details. Providing fraudulent addresses or unauthorized payment instruments is a violation of federal law and grounds for immediate order cancellation and reporting.

---

## 4. Botanical Nature & Natural Floral Variations

Fresh Indian flowers, garlands, and leaves are living agricultural products subject to climate, seasonal harvest cycles, and botanical individuality:
* **Natural Variations:** Slight natural differences in blossom diameter, color saturation, petal count, and fragrance intensity are inherent to fresh flora and do not constitute defective merchandise.
* **Sacred Floral Substitution Policy:** If adverse agricultural weather or seasonal harvest shortfalls make a specific blossom unavailable, our master florists reserve the right to substitute with fresh blooms of **equal or greater commercial and ceremonial value** that honor the color harmony and spiritual sanctity of your celebration. Whenever practicable, our concierge will notify you in advance.

---

## 5. Pricing, Sales Tax, and Payment Terms

* **Authoritative Pricing:** Product prices are subject to change without prior notice based on seasonal crop availability and air-freight energy surcharges. However, confirmed orders will be honored at the price charged at checkout.
* **State & Local Sales Tax:** Where statutory economic nexus requirements apply, destination-based state, county, and local sales tax will be automatically calculated and itemized during checkout.
* **Payment Settlement:** Online orders are settled via credit card or authorized digital gateways (via Razorpay International). Cash on Delivery (COD) is available strictly where explicitly offered and verified by store administration.

---

## 6. Intellectual Property Rights

All content displayed on Indian-Flowers.com—including brand trademarks, logo marks, high-resolution product photography, garland designs, floral descriptions, editorial guides, software code, and visual layouts—is the exclusive intellectual property of Indian-Flowers.com and protected under US and international copyright and trademark laws. Unauthorized reproduction, scraping, framing, or commercial redistribution is strictly prohibited.

---

## 7. Limitation of Liability

To the maximum extent permitted under applicable United States law:
* Indian-Flowers.com, its directors, officers, employees, and suppliers shall not be liable for any indirect, incidental, punitive, special, or consequential damages resulting from the use of, or inability to use, our floral products or website.
* In all circumstances, our maximum aggregate liability arising out of or related to any order shall not exceed the total dollar amount paid by you for that specific order.
* We are not liable for transit delays caused by third-party carriers due to acts of God, extreme weather, air cargo ground stops, customs inspections, or government embargoes.

---

## 8. Binding Arbitration & Class Action Waiver

Any dispute, claim, or controversy arising out of or relating to your use of Indian-Flowers.com or purchases made on the site shall be resolved through final and binding arbitration administered by the **American Arbitration Association (AAA)** under its Commercial Arbitration Rules, rather than in court. You agree to resolve all disputes on an individual basis and waive any right to bring or participate in a class, consolidated, or representative action.

---

## 9. Governing Law & Severability

These Terms and Conditions are construed and enforced under the laws of the **State of California**, without regard to conflict of law principles. If any provision of these terms is deemed unlawful or unenforceable by an arbitrator or court of competent jurisdiction, that provision shall be severable and shall not affect the validity of the remaining provisions.`
  },
  {
    slug: 'refund-policy',
    title: 'Refund & Cancellation Policy',
    subtitle: 'Clear, equitable guarantees for perishable Indian flora, wedding jai malas, and temple worship supplies.',
    category: 'legal',
    effectiveDate: 'October 15, 2026',
    lastUpdated: 'October 15, 2026',
    metaDescription: 'Read the official Refund & Cancellation Policy of Indian-Flowers.com. Learn our 24-hour freshness guarantee, photo verification process, and refund timelines.',
    isPublished: true,
    order: 4,
    content: `## 1. Perishable Floral Goods Policy

At **Indian-Flowers.com**, our goal is your complete satisfaction and spiritual fulfillment on your auspicious celebration day. Because fresh flowers, sacred leaves, and hand-tied garlands are living, perishable agricultural items with limited biological lifespans:
* **No Physical Returns of Fresh Flowers:** Fresh cut flowers cannot be mailed back or returned to our distribution hubs once delivered.
* **Freshness Guarantee:** We back every parcel with our **24-Hour Freshness & Quality Guarantee**.

---

## 2. The 24-Hour Freshness Guarantee & Reporting Protocol

If your flowers arrive in compromised condition, damaged in transit, or differing materially from your confirmed order specifications:
1. **Notice Within 24 Hours:** You must notify our US customer support team within **24 hours of package delivery timestamp** (as recorded by the carrier delivery scan).
2. **Photo Documentation:** Email **indianflowersorder@gmail.com** with your **Order ID** and **2 to 3 clear, well-lit photographs** showing:
   * The flowers in the condition received.
   * The inner cold-chain packaging and gel pack status.
   * The carrier shipping label affixed to the exterior carton.
3. **Prompt Concierge Review:** Our floral quality managers review claims within **2 to 4 business hours**.

---

## 3. Resolution Options

Upon validation of your claim, we offer the following remedies based on your ceremony schedule and preference:
* **Expedited Replacement Dispatch:** If timing permits before your ceremony or puja muhurtham, we will immediately rush a priority replacement parcel at zero additional cost to you.
* **Full or Partial Store Refund:** If a replacement cannot arrive in time for your event, we will issue a direct refund to your original payment method proportional to the affected items.
* **Store Credit Voucher:** Alternatively, you may choose store credit with an added 10% courtesy bonus valid for any future floral celebration.

---

## 4. Order Cancellation Guidelines

Because our florists source, harvest, and hand-tie fresh blooms specifically for each confirmed order:
* **Standard Floral & Pooja Leaf Orders:** Cancellations are accepted with a **100% full refund** if requested at least **48 hours prior** to the scheduled harvest and dispatch date.
* **Custom Wedding Jai Malas & Bridal Garlands:** Handcrafted bridal garlands require specialized floral artisans and extensive prep. Cancellations must be requested at least **72 hours prior** to the scheduled dispatch date.
* **Same-Day / Already Dispatched Orders:** Once an order has been cut, conditioned, and tendered to FedEx or UPS, it cannot be cancelled or recalled, and payment is non-refundable.

---

## 5. Non-Perishable Samagri & Brass Hardware Returns

Non-perishable ceremonial items (such as brass kuthuvilakku lamps, puja thali sets, incense burners, and dry samagri boxes):
* Eligible for return within **14 calendar days** of delivery.
* Items must be unused, in pristine original condition, and in original packaging.
* Customer is responsible for return shipping postage unless the item arrived damaged or defective.

---

## 6. Refund Processing Timelines

* Refunds are submitted immediately upon claim approval to our payment gateway partner, **Razorpay International**.
* Banks and credit card issuers typically take **3 to 7 business days** to post the refund credit to your original card statement.
* Refunds will be clearly itemized and credited in **US Dollars (USD)**.`
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer & Product Disclosures',
    subtitle: 'Important notices regarding the ceremonial use, botanical nature, and non-consumption of fresh flowers and sacred leaves.',
    category: 'compliance',
    effectiveDate: 'October 15, 2026',
    lastUpdated: 'October 15, 2026',
    metaDescription: 'Read the official Product Disclaimer for Indian-Flowers.com. Important guidance on ceremonial use, non-consumption warnings, botanical variations, and carrier liability.',
    isPublished: true,
    order: 5,
    content: `## 1. Intended Use: Ceremonial & Cultural Only

All fresh Indian blossoms, floral strings, hand-tied garlands (*Jai Malas*, temple malas), loose pooja flowers, and sacred foliage (including Mango leaves, Betel leaves, and Banana leaves) sold on **Indian-Flowers.com** are intended **strictly and exclusively for cultural, religious, decorative, and ceremonial veneration** (e.g., *Archana, Pooja, Homa, Wedding Muhurtham, Griha Pravesh*, and festive home decoration).

---

## 2. STRICT NON-CONSUMPTION & HEALTH WARNING

> [!CAUTION]
> **NOT FOR HUMAN OR ANIMAL CONSUMPTION:** None of the flowers, strings, or leaves sold on this Site are certified as culinary or food-grade ingredients. 

* **Do Not Eat:** Do not ingest, steep into teas, chew, or incorporate into food preparations.
* **Keep Away from Pets & Children:** Keep all floral arrangements, garland cords, strings, and betel leaves away from infants, small children, and domestic pets (such as cats and dogs), as certain botanical species and natural plant saponins may cause stomach distress or allergic reactions in animals.
* **Sacred Leaves:** Even traditional leaves such as Betel leaves (*Paan ke patte*) and Mango leaves provided by our service are agricultural cuts supplied strictly as devotional altar offerings (*Puja Samagri*) and are not certified for culinary consumption.

---

## 3. Botanical Allergies & Sensitivity Disclosures

Flowers naturally produce pollen and organic botanical dust. Customers or event attendees with known sensitivities, asthma, or floral allergies (specifically to Marigolds, Jasmine, Chrysanthemums, or Lilies) should exercise standard personal precautions when handling natural bouquets or wearing heavy neck garlands.

---

## 4. Agricultural Variations & Fragrance Realities

Because our products are cultivated naturally and hand-tied by traditional floral artisans:
* Floral blossoms may open, mature, or exhibit slight shade variations depending on the time of day, seasonal harvest temperature, and atmospheric humidity.
* Jasmine (*Mallipoo*) buds are harvested semi-closed to maximize vase-life during overnight transit; they will gradually open and release their sacred fragrance upon reaching room temperature.
* These natural biological occurrences are hallmarks of genuine fresh-cut flora and are not manufacturing defects.

---

## 5. Third-Party Carrier Limitation

Indian-Flowers.com guarantees on-time packaging, cold-chain temperature preservation, and prompt tender to air cargo carriers (FedEx, UPS). However, we are not liable for delayed arrivals resulting directly from third-party carrier transit disruptions, severe weather grounding, customs inspection delays, or mechanical aircraft failures outside our direct custody.`
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie & Tracking Technologies Policy',
    subtitle: 'Information on how Indian-Flowers.com uses cookies, local storage, and tracking technologies to deliver a secure, personalized shopping experience.',
    category: 'compliance',
    effectiveDate: 'October 15, 2026',
    lastUpdated: 'October 15, 2026',
    metaDescription: 'Read the official Cookie Policy of Indian-Flowers.com. Learn what cookies we use, how shopping cart sessions work, and how to manage your privacy preferences.',
    isPublished: true,
    order: 6,
    content: `## 1. What Are Cookies and Local Storage?

Cookies are small text files that websites store on your computer, tablet, or smartphone when you visit. They are widely used to make websites work efficiently, remember your preferences between visits, and ensure checkout security. **Local Storage** is an HTML5 browser technology that allows our storefront to store shopping cart data safely on your own computer without transmitting tracking data across the internet.

---

## 2. Categories of Cookies We Use

Indian-Flowers.com uses a minimal, privacy-conscious cookie and storage framework:

### A. Strictly Necessary & Essential Cookies (Cannot be switched off)
These cookies and local storage tokens are essential for you to browse the website and use its core e-commerce functions:
* **Shopping Cart State (\`if_cart\`):** Retains your selected garlands, flower strings, and item quantities in your local browser so you don't lose your selections while browsing different floral collections.
* **Wishlist State (\`if_wishlist\`):** Saves your bookmarked ceremonial items locally on your device.
* **Session & Security Tokens:** Authenticates administrator sessions and prevents Cross-Site Request Forgery (CSRF) attacks.
* **Payment Security:** Facilitates encrypted communication with our PCI-DSS Level 1 gateway partner, Razorpay International, during payment checkout.

### B. Functional & Preference Cookies
These enable enhanced features and personalized convenience:
* **Delivery Destination Memory:** Remembers your selected US state and ZIP code so the sales tax engine can preview accurate local tax estimates without re-prompting.
* **Navigation Preferences:** Remembers recently viewed floral categories.

### C. Analytics & Performance Cookies
These collect aggregated, anonymized metrics to help us understand storefront performance:
* Gauging page loading speeds across different US geographic regions.
* Identifying which flower collections are most popular during wedding and festive seasons.
* Identifying broken links or interface bottlenecks to optimize site stability.

---

## 3. Third-Party Cookies

When you use our storefront, certain trusted third-party providers may place technical cookies on your device:
* **Razorpay Payment Gateway:** Necessary for fraud detection, card tokenization, and processing US Dollar transactions safely.
* **Analytics Providers:** Aggregated performance monitoring tools (such as Google Analytics) operating under anonymized IP configurations.

**We do not use third-party data brokers or sell cross-site behavioral tracking cookies to advertising networks.**

---

## 4. How You Can Manage or Block Cookies

Most modern web browsers allow you to control or delete cookies through browser settings:
* **Google Chrome:** Settings → Privacy and Security → Third-party cookies.
* **Apple Safari:** Preferences → Privacy → Block all cookies (or Manage Website Data).
* **Mozilla Firefox:** Settings → Privacy & Security → Enhanced Tracking Protection.
* **Microsoft Edge:** Settings → Cookies and site permissions → Manage and delete cookies.

*Please note: If you completely disable all cookies and local storage, key e-commerce features (such as adding items to your cart or completing online checkout) will not function properly.*

---

## 5. Global Privacy Control (GPC) & Do Not Track

We respect consumer privacy signals. Our systems are engineered to honor **Global Privacy Control (GPC)** signals broadcast by modern privacy browsers, automatically disabling optional analytics tracking for that session.

---

## 6. Contact Us Regarding Cookies

If you have questions regarding our use of cookies or local storage technologies, please contact our web compliance team at **indianflowersorder@gmail.com** or call **+1 (909) 379-3678**.`
  }
];
