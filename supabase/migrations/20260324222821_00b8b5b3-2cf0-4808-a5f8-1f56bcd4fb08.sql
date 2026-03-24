
-- Profiles table for auth users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Businesses table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#1a1b2e',
  tagline text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owners can update own business" ON public.businesses FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Authenticated can create business" ON public.businesses FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- Business services
CREATE TABLE public.business_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL,
  duration text DEFAULT '30 min',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active services" ON public.business_services FOR SELECT USING (true);
CREATE POLICY "Owners can manage services" ON public.business_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid()));

-- Add business_id to bookings
ALTER TABLE public.bookings ADD COLUMN business_id uuid REFERENCES public.businesses(id);

-- Trigger for businesses updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
