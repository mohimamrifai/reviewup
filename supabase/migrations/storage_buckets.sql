-- Setup Supabase Storage buckets untuk deposits & products
-- deposits: member upload bukti transfer, admin read
-- products: admin only upload/read (gambar produk)

-- ============ BUCKET: deposits ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deposits',
  'deposits',
  false, -- private bucket
  5 * 1024 * 1024, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============ BUCKET: products ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true, -- public bucket (gambar produk bisa dilihat publik)
  2 * 1024 * 1024, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============ RLS: deposits ============
-- Path convention: {user_id}/{deposit_id}.{ext}
-- Member bisa upload ke folder miliknya sendiri
CREATE POLICY "deposits: member upload own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deposits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Member bisa read deposit miliknya sendiri
CREATE POLICY "deposits: member read own folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin bisa read semua deposit
CREATE POLICY "deposits: admin read all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposits'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin_leader', 'admin_staff')
    )
  );

-- Admin bisa delete (cleanup)
CREATE POLICY "deposits: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deposits'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin_leader', 'admin_staff')
    )
  );

-- ============ RLS: products ============
-- Public read (gambar produk untuk katalog)
CREATE POLICY "products: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- Admin only: insert/update/delete
CREATE POLICY "products: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin_leader', 'admin_staff')
    )
  );

CREATE POLICY "products: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin_leader', 'admin_staff')
    )
  );

CREATE POLICY "products: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin_leader', 'admin_staff')
    )
  );
