# SalamaFarm Partner Hub

This is a modern, responsive Web Portal & Vendor Dashboard for "SalamaFarm Partner Agrovets". This portal allows registered agrovet store owners to sign up, verify their store, manage product inventory (CRUD), track direct M-Pesa sales analytics, and conduct post-purchase customer follow-ups.

Design Style: Clean, professional, SaaS dashboard style using Tailwind CSS, Lucide icons, and a rich agricultural green (#1E5631), crisp white, and clean slate gray color palette.

1. AGROVET ONBOARDING & VERIFICATION FLOW (AUTH PAGE)

- Simple 2-Step Registration Form:

  * Step 1: Store Details (Agrovet Name, Physical Location/Town, County, M-Pesa Till/Paybill Number, WhatsApp Phone Number).

  * Step 2: Verification Upload (Upload copy of Business Permit or Agrochemical License) + "Submit for Verification" button.

- Status Indicator Banner: Displays "Verified Merchant ✅" or "Pending Verification ⏳" at the top of the dashboard.

2. DASHBOARD OVERVIEW & ANALYTICS TAB

- Top Metric Cards:

  * Total Direct Sales Revenue (KES)

  * Active Products Listed

  * Total App Customer Visits / Calls Triggered

  * Pending Customer Follow-Ups

- Sales Analytics Chart: Recharts bar/line graph showing weekly sales trends and top-performing categories (Fertilizer, Seeds, Vet Supplies, Pesticides).

- Quick Action Buttons: "+ Add New Product", "Toggle Store Status (Open/Closed)", "View M-Pesa Log".

3. PRODUCT INVENTORY MANAGEMENT (FULL C.R.U.D PAGE)

- Interactive Product Table with Search, Filter by Category, and Sorting:

  * Columns: Image Thumbnail, Product Name, Category Badge, Batch/Stock Quantity, Price (KES), Expiry Date, Status (In Stock, Low Stock, Expired), and Actions (Edit / Delete / Toggle Active).

- Modal Drawer for Adding/Editing Products:

  * Form Fields: Product Title, Category Dropdown, Chemical Composition / Usage Instructions, Price in KES, Stock Quantity, Expiry Date, and Product Image Upload slot.

- Smart Inventory Badges: Highlight items in Red if stock < 5 units or if expiry date is within 30 days ("Clearance Candidate").

4. CUSTOMER CARE & POST-PURCHASE FOLLOW-UP HUB (CRM)

- A dedicated CRM table tracking buyers who purchased items from the store via the mobile app:

  * Columns: Customer Name/Phone, Item Purchased, Date of Purchase, M-Pesa Confirmation Code, Follow-Up Status (Pending, Contacted, Satisfied).

- Direct Communication Action Buttons:

  * "One-Tap WhatsApp Follow-Up": Opens WhatsApp with a pre-filled contextual message: "Habari! This is [Store Name]. Just checking in to see if the [Product Name] you bought on [Date] worked well for your farm?"

  * "Direct Call": Phone icon shortcut launching phone dialer.

5. M-PESA TRANSACTION RECONCILIATION LOG

- A simplified log view matching customer-submitted M-Pesa confirmation codes against completed pickups to help store attendants prevent fraud during counter collection.

Ensure all components are modular, fully responsive (optimized for both desktop monitors and tablet/mobile screens used at store counters), and seamlessly structured using React / Tailwind CSS.


**Live app**: https://farm-grow-dash.lovable.app

## Build with Lovable


- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
