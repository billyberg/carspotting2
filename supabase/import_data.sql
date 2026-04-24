-- Importdata från Carspotting gamla app (CSV)
-- Kör EFTER att 002_imports.sql är applicerad.

insert into pending_imports (email, display_name, bootstrap_plate, avatar_url) values
  ('billybuster@gmail.com', 'Billy', 246, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/jYNYFujhrfWQjoQhyMwb/pub/c8jrU0NaKiDNDOm1uAoi.jpeg'),
  ('fredrik.ivanov@hotmail.com', 'Ivanov_F', 11, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/yWh88o4L9tTGlb78AKBZ/pub/hTz1moHmQPziZa84nTc9.jpeg'),
  ('sara.ahlund@gmail.com', 'Sarfrid', 11, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/yWh88o4L9tTGlb78AKBZ/pub/zujcsHQW0s8vPzK2B6lB.jpg'),
  ('lottaberg61@gmail.com', 'Lottis', 101, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/yWh88o4L9tTGlb78AKBZ/pub/KTH2VXoHpfsc8cadxloo.jpeg'),
  ('anna.ahlund@live.se', 'Anna', 18, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/yWh88o4L9tTGlb78AKBZ/pub/nLymV7YiFpJUQ7R4bORR.jpeg'),
  ('jonatan@peplon.se', 'Jonatan', 267, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/yWh88o4L9tTGlb78AKBZ/pub/eSJZSfZTaqJmA5OBa9FF.jpeg'),
  ('v.friberg@live.se', 'Viktor', 100, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/yWh88o4L9tTGlb78AKBZ/pub/VJIjCaLmr0xPY7QXrjqW.jpeg'),
  ('wikanderman@gmail.com', 'Vicke', 76, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/7LD4S0YoldED8Uwg3VfX/pub/0CPHKbBlIFCLigqqSmlS.jpg'),
  ('apelsinfabriken@gmail.com', 'Hakan', 1, null),
  ('bjorn.ake.andreas.roth@gmail.com', 'Andreas', 17, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/jYNYFujhrfWQjoQhyMwb/pub/khKuoav8sFhlnsGILbOu.jpeg')
on conflict (email) do update set
  display_name = excluded.display_name,
  bootstrap_plate = excluded.bootstrap_plate,
  avatar_url = excluded.avatar_url;

-- Rader som hoppades över (saknar email):
--   Lena (nummer 122)
--   Rikard (nummer 278)
--   Olle (nummer 7)
