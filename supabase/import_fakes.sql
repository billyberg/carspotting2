-- Importdata för fake-profiler från gamla appen.
-- Kör EFTER att 003_fake_imports.sql är applicerad.

insert into pending_fake_imports (manager_email, display_name, bootstrap_plate, avatar_url) values
  ('billybuster@gmail.com', 'Lena', 122, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/7LD4S0YoldED8Uwg3VfX/pub/hRQyW4zco92GvrvewJ6y.jpeg'),
  ('billybuster@gmail.com', 'Olle', 7, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/7LD4S0YoldED8Uwg3VfX/pub/iTpULsC1xoak1iJFcVKY.jpeg'),
  ('wikanderman@gmail.com', 'Rikard', 278, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/7LD4S0YoldED8Uwg3VfX/pub/DWTRt3CxNs66mJh2N3yQ.jpg');

-- Flusha omedelbart för hanterare som redan har profil.
-- (Returnerar antalet skapade fake-profiler.)
select flush_pending_fakes('billybuster@gmail.com') as billy_fakes_created;
select flush_pending_fakes('wikanderman@gmail.com') as wicke_fakes_created;
