
-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'assigned', 'completed');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  service TEXT NOT NULL,
  service_price INTEGER NOT NULL,
  time_window TEXT NOT NULL,
  booking_date DATE NOT NULL,
  express BOOLEAN NOT NULL DEFAULT false,
  total_price INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings (public booking form)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read bookings (simple admin - no auth for now)
CREATE POLICY "Anyone can view bookings"
  ON public.bookings FOR SELECT
  USING (true);

-- Allow anyone to update booking status (simple admin)
CREATE POLICY "Anyone can update bookings"
  ON public.bookings FOR UPDATE
  USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
