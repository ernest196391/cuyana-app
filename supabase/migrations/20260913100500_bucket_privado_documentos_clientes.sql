-- El archivo del carnet.
--
-- `public = false` es lo único que separa «una foto de un carnet» de «una foto
-- de un carnet en internet». Sin eso, cualquiera con la URL la abre: no hay
-- sesión, no hay RLS, no hay nada. Con esto, solo se llega con un enlace
-- firmado de vida corta que pide el servidor bajo sesión.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP como
-- `20260913015342_bucket_privado_documentos_clientes`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-clientes', 'documentos-clientes', false, 8388608,
        array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','application/pdf'];

-- Cada cliente escribe SOLO dentro de su propia carpeta, que lleva su id.
-- El primer tramo de la ruta es el id del usuario: documentos-clientes/<uid>/…
drop policy if exists doc_cliente_sube on storage.objects;
create policy doc_cliente_sube on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos-clientes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists doc_cliente_ve_lo_suyo on storage.objects;
create policy doc_cliente_ve_lo_suyo on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos-clientes'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
  );

-- Puede reemplazar el suyo si salió movido, pero no borrar el de nadie más.
drop policy if exists doc_cliente_reemplaza on storage.objects;
create policy doc_cliente_reemplaza on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos-clientes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Borrar un documento de identidad es cosa del administrador: hay que poder
-- responder por qué se guardó y por qué dejó de estar.
drop policy if exists doc_borra_admin on storage.objects;
create policy doc_borra_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos-clientes' and public.es_admin());
