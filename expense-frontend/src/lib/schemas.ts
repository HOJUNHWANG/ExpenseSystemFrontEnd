import { z } from 'zod';
import { ITEM_TYPES } from '../components/ExpenseReportForm';

// ─── Item Schemas ──────────────────────────────────────────────────────────────
export const normalItemSchema = z.object({
  type: z.literal(ITEM_TYPES.NORMAL),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be a positive number'),
  category: z.string().min(1, 'Category is required'),
});

export const mileageItemSchema = z.object({
  type: z.literal(ITEM_TYPES.MILEAGE),
  date: z.string().optional(),
  miles: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Miles must be a positive number'),
  rate: z.number(),
  amount: z.number(),
  category: z.string(),
  description: z.string(),
});

export const mealItemSchema = z
  .object({
    type: z.literal(ITEM_TYPES.MEAL),
    date: z.string().min(1, 'Meal date is required'),
    lunch: z.boolean(),
    dinner: z.boolean(),
    amount: z.number(),
    category: z.string(),
    description: z.string(),
  })
  .refine((v) => v.lunch || v.dinner, {
    message: 'Select lunch and/or dinner',
    path: ['lunch'],
  });

export const formItemSchema = z.discriminatedUnion('type', [
  normalItemSchema,
  mileageItemSchema,
  mealItemSchema,
]);

// ─── Report Header Schema ─────────────────────────────────────────────────────
export const expenseReportHeaderSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    city: z.string().min(1, 'City is required'),
    countrySelect: z.string().min(1, 'Country is required'),
    countryOther: z.string().optional(),
    departureDate: z.string().min(1, 'Departure date is required'),
    returnDate: z.string().min(1, 'Return date is required'),
  })
  .refine(
    (data) => {
      if (data.departureDate && data.returnDate) {
        return data.departureDate <= data.returnDate;
      }
      return true;
    },
    { message: 'Return date must be after departure date', path: ['returnDate'] }
  )
  .refine(
    (data) => {
      if (data.countrySelect === '__OTHER__') {
        return !!data.countryOther?.trim();
      }
      return true;
    },
    { message: 'Please enter a country name', path: ['countryOther'] }
  );

export type ExpenseReportHeaderValues = z.infer<typeof expenseReportHeaderSchema>;
