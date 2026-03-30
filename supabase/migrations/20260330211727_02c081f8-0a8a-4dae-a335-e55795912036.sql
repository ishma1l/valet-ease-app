-- Function to get all workers (profiles with 'worker' role) - security definer to bypass RLS
CREATE OR REPLACE FUNCTION public.get_workers()
RETURNS TABLE (id uuid, full_name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'worker'
  ORDER BY p.full_name;
$$;