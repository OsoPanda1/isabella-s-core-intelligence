CREATE OR REPLACE FUNCTION public.ledger_verify()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  _uid UUID := auth.uid();
  _r public.ledger_entries;
  _prev TEXT := repeat('0', 64);
  _expected TEXT;
  _expected_seq BIGINT := 0;
  _total INT := 0;
  _broken JSONB := '[]'::jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Identidad no autenticada';
  END IF;

  FOR _r IN SELECT * FROM public.ledger_entries WHERE user_id = _uid ORDER BY seq ASC LOOP
    _total := _total + 1;
    _expected_seq := _expected_seq + 1;

    _expected := encode(extensions.digest(
      _r.prev_hash || '|' || _r.user_id::text || '|' || _r.seq::text || '|' || _r.event_type || '|' || _r.module || '|' ||
      COALESCE(_r.risk,'') || '|' || COALESCE(_r.status,'') || '|' || _r.payload::text || '|' ||
      to_char(_r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.USZ'),
      'sha256'), 'hex');

    IF _r.seq <> _expected_seq OR _r.prev_hash <> _prev OR _r.hash <> _expected THEN
      _broken := _broken || jsonb_build_object(
        'seq', _r.seq,
        'id', _r.id,
        'expected_seq', _expected_seq,
        'expected_prev_hash', _prev,
        'stored_prev_hash', _r.prev_hash,
        'expected_hash', _expected,
        'stored_hash', _r.hash
      );
    END IF;

    _prev := _r.hash;
  END LOOP;

  RETURN jsonb_build_object(
    'verified_at', now(),
    'total', _total,
    'intact', jsonb_array_length(_broken) = 0,
    'head_hash', _prev,
    'broken', _broken
  );
END;
$$;
REVOKE ALL ON FUNCTION public.ledger_verify() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ledger_verify() TO authenticated;