export interface PropertyDetails {
  address: string;
  propertyType: 'residential' | 'commercial' | 'industrial';
  size?: {
    squareMeters?: number;
    bedrooms?: number;
    bathrooms?: number;
    floors?: number;
  };
  yearBuilt?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_renovation';
}

export interface ServiceItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface QuoteData {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  property: PropertyDetails;
  services: ServiceItem[];
  subtotal: number;
  gst: number;
  total: number;
  validUntil: string;
  notes?: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}

export interface QuoteGenerationRequest {
  transcript: string;
  clientName?: string;
  clientEmail?: string;
  additionalNotes?: string;
}

export interface QuoteGenerationResponse {
  success: boolean;
  quote?: QuoteData;
  error?: string;
  warnings?: string[];
}