export interface WhatsAppCheckoutItem {
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

export interface WhatsAppCheckoutCustomer {
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  email?: string;
}

export interface WhatsAppCheckoutAddress {
  name?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  tag?: string;
}

export interface WhatsAppCheckoutParams {
  items: WhatsAppCheckoutItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  grandTotal: number;
  customer?: WhatsAppCheckoutCustomer;
  address?: WhatsAppCheckoutAddress;
  whatsappNumber?: string;
}

export const DEFAULT_STORE_WHATSAPP = '918086388058';

export function createWhatsAppOrderUrl({
  items,
  subtotal,
  discount = 0,
  shipping,
  grandTotal,
  customer,
  address,
  whatsappNumber,
}: WhatsAppCheckoutParams): string {
  const targetNumber = (
    whatsappNumber ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    DEFAULT_STORE_WHATSAPP
  ).replace(/[^0-9]/g, '');

  let text = `*NEW ORDER / PURCHASE ENQUIRY - STYLISH FOX*\n\n`;
  text += `Hello Stylish Fox Team, I would like to purchase the following products:\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🛍️ *PRODUCTS SELECTED:*\n`;

  items.forEach((item, index) => {
    text += `${index + 1}. *${item.name}*\n`;
    text += `   • Color: ${item.color}\n`;
    text += `   • Size: ${item.size}\n`;
    text += `   • Quantity: ${item.quantity}\n`;
    text += `   • Price: ₹ ${(item.price * item.quantity).toLocaleString()} (₹ ${item.price.toLocaleString()} each)\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 *PRICE SUMMARY:*\n`;
  text += `• Items Subtotal: ₹ ${subtotal.toLocaleString()}\n`;
  if (discount > 0) {
    text += `• Applied Discount: -₹ ${discount.toLocaleString()}\n`;
  }
  text += `• Shipping Charges: ${shipping === 0 ? 'FREE' : `₹ ${shipping}`}\n`;
  text += `*★ FINAL AMOUNT: ₹ ${grandTotal.toLocaleString()}*\n\n`;

  if (customer && (customer.firstName || customer.contactNumber || customer.whatsappNumber)) {
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *CUSTOMER DETAILS:*\n`;
    text += `• Name: ${customer.firstName || ''} ${customer.lastName || ''}`.trim() + `\n`;
    if (customer.whatsappNumber || customer.contactNumber) {
      text += `• WhatsApp: ${customer.whatsappNumber || customer.contactNumber}\n`;
      if (customer.contactNumber && customer.whatsappNumber && customer.contactNumber !== customer.whatsappNumber) {
        text += `• Calling Phone: ${customer.contactNumber}\n`;
      }
    }
    if (customer.email) {
      text += `• Email: ${customer.email}\n`;
    }
    text += `\n`;
  }

  if (address && address.street) {
    text += `📍 *DELIVERY ADDRESS:*\n`;
    text += `${address.street}, ${address.city}, ${address.state} - ${address.pincode}\n\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Please confirm this order, product availability, and provide payment details to proceed. Thank you!`;

  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}

export interface WhatsAppRebookParams {
  productName: string;
  color?: string;
  size?: string;
  price?: number;
  productId?: string | number;
  customer?: WhatsAppCheckoutCustomer;
  whatsappNumber?: string;
}

export function createWhatsAppRebookUrl({
  productName,
  color,
  size,
  price,
  productId,
  customer,
  whatsappNumber,
}: WhatsAppRebookParams): string {
  const targetNumber = (
    whatsappNumber ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    DEFAULT_STORE_WHATSAPP
  ).replace(/[^0-9]/g, '');

  let text = `*🔄 REBOOK / OUT OF STOCK ENQUIRY - STYLISH FOX*\n\n`;
  text += `Hello Stylish Fox Team, I noticed that the following item is currently *OUT OF STOCK* and I would like to place a *REBOOK ENQUIRY* / pre-order request:\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📦 *PRODUCT DETAILS:*\n`;
  text += `• *Product:* ${productName}\n`;
  if (color) text += `• *Color/Shade:* ${color}\n`;
  if (size) text += `• *Size:* ${size}\n`;
  if (price) text += `• *Price:* ₹ ${price.toLocaleString()}\n`;
  if (productId) text += `• *Reference ID:* #${productId}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (customer && (customer.firstName || customer.contactNumber)) {
    text += `👤 *CUSTOMER DETAILS:*\n`;
    text += `• Name: ${customer.firstName || ''} ${customer.lastName || ''}`.trim() + `\n`;
    if (customer.contactNumber) {
      text += `• Phone / WhatsApp: ${customer.contactNumber}\n`;
    }
    if (customer.email) {
      text += `• Email: ${customer.email}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  text += `Please let me know when this item will be restocked or how I can pre-book it right away. Thank you!`;

  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}
