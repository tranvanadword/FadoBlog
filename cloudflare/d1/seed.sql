INSERT OR IGNORE INTO Category (id, name, slug, description)
VALUES
  ('cat-cong-nghe', 'Cong nghe', 'cong-nghe', 'Tin tuc cong nghe va AI'),
  ('cat-du-lich', 'Du lich', 'du-lich', 'Kinh nghiem va diem den'),
  ('cat-am-thuc', 'Am thuc', 'am-thuc', 'Mon ngon va van hoa am thuc');

INSERT OR IGNORE INTO Tag (id, name, slug)
VALUES
  ('tag-ai', 'AI', 'ai'),
  ('tag-nang-suat', 'Nang suat', 'nang-suat'),
  ('tag-xu-huong', 'Xu huong', 'xu-huong');

INSERT OR IGNORE INTO Page (id, title, slug, content, status, seoTitle, metaDescription)
VALUES
  ('page-about', 'Gioi thieu FadoBlog', 'gioi-thieu', 'FadoBlog la he thong tin tuc va CMS hien dai, co the mo rong workflow AI.', 'published', 'Gioi thieu FadoBlog', 'Tim hieu ve FadoBlog.'),
  ('page-contact', 'Lien he', 'lien-he', 'Gui tin nhan cho doi ngu FadoBlog.', 'published', 'Lien he FadoBlog', 'Lien he voi FadoBlog.');

INSERT OR IGNORE INTO Setting (key, valueJson)
VALUES (
  'site',
  '{"siteName":"FadoBlog","siteDescription":"Tin tuc, cong nghe, du lich, am thuc va doi song.","logoUrl":"","publicUrl":"https://fadoblog.example","defaultSeoTitle":"FadoBlog","defaultMetaDescription":"FadoBlog chia se noi dung huu ich moi ngay.","facebookUrl":"","youtubeUrl":"","linkedinUrl":"","contactEmail":"hello@fadoblog.local","headerLinks":[],"footerLinks":[]}'
);
