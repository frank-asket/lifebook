-- A Bible passage chosen for each prayer when it is saved, sealed like the prayer itself (lbenc:v1 envelope).
-- Additive and nullable: existing prayers simply have no verse.
ALTER TABLE "PrayerEntry" ADD COLUMN "verseCiphertext" TEXT;
