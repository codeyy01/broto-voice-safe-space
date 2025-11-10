-- Create functions for upvote count management
CREATE OR REPLACE FUNCTION public.increment_upvote_count(ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.tickets
  SET upvote_count = upvote_count + 1
  WHERE id = ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_upvote_count(ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.tickets
  SET upvote_count = GREATEST(upvote_count - 1, 0)
  WHERE id = ticket_id;
END;
$$;