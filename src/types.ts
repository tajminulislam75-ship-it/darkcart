/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number; // in BDT
  originalPrice?: number; // for showing discount
  description: string;
  images: string[];
  colors: string[];
  storageOptions: string[];
  selectedColor?: string; // transient for cart
  selectedStorage?: string; // transient for cart
  specs: {
    camera: string;
    battery: string;
    processor: string;
    screen: string;
    weight?: string;
    os?: string;
  };
  stockStatus: "In Stock" | "Limited Stock" | "Out of Stock" | "Pre-Order";
  isExclusive: boolean;
  featured: boolean;
  offerText?: string;
  category: "Flagship" | "Gaming" | "Exclusive" | "Mid-Range";
}

export interface Order {
  id: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: {
    product: {
      id: string;
      name: string;
      price: number;
      image: string;
    };
    color: string;
    storage: string;
    quantity: number;
  }[];
  paymentMethod: "bKash" | "Nagad" | "Rocket" | "Bank Transfer";
  paymentDetails: {
    accountNo?: string; // the sender number or bank account
    transactionId: string;
    note?: string;
    paymentProofBase64?: string; // base64 version
  };
  total: number;
  status: "Pending Check" | "Processing" | "Completed" | "Cancelled";
  createdAt: string;
}

export interface SiteSettings {
  paymentNumbers: {
    bKash: string;
    Nagad: string;
    Rocket: string;
    bankTransfer: {
      bankName: string;
      accountName: string;
      accountNo: string;
      branch: string;
    };
  };
  banners: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    active: boolean;
  }[];
  offers: {
    id: string;
    title: string;
    description: string;
    code: string;
    discountPercent: number;
    active: boolean;
  }[];
  reviews: {
    id: string;
    name: string;
    rating: number; // 1-5
    comment: string;
    date: string;
    avatar: string;
    phoneModel: string;
  }[];
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    whatsapp: string;
    facebook: string;
    telegram?: string;
  };
}
