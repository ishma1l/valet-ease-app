
-- Storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true);

-- Photos metadata table
CREATE TABLE public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job photos" ON public.job_photos FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert job photos" ON public.job_photos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete job photos" ON public.job_photos FOR DELETE TO public USING (true);

-- Storage RLS
CREATE POLICY "Anyone can upload job photos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'job-photos');
CREATE POLICY "Anyone can view job photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'job-photos');
CREATE POLICY "Anyone can delete job photos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'job-photos');
