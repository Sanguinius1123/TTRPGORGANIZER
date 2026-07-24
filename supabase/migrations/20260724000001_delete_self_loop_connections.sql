-- Remove self-loop connections (from_location_id = to_location_id)
-- These were created by a bug in the C key handler where lastPlacedRef
-- pointed to the newly created node before the connection was made.
DELETE FROM location_connections
WHERE from_location_id = to_location_id;
