-- Seed data for Libyans in North America.
-- Safe to run once after the initial migration.

insert into public.settings (
  id,
  hero_subtitle_en,
  hero_subtitle_ar,
  footer_about_en,
  footer_about_ar,
  phones,
  facebook_url,
  x_url,
  instagram_url,
  tiktok_url,
  updated_at,
  updated_by
) values (
  'site',
  'A shared home for Libyan families across the United States and Canada — our people, our skills, our stories, and the work we do together.',
  'بيت جامع للعائلات الليبية في الولايات المتحدة وكندا — ناسنا، مهاراتنا، حكاياتنا، والعمل الذي ننجزه معاً.',
  'A community-built platform connecting Libyan families across the United States and Canada, and introducing the world to the Libyan diaspora.',
  'منصة بناها المجتمع لربط العائلات الليبية في الولايات المتحدة وكندا، وتعريف العالم بالجاليات الليبية.',
  array['+1 (313) 555-0142', '+1 (416) 555-0198'],
  'https://facebook.com/groups/libyansna',
  'https://x.com/libyansna',
  'https://instagram.com/libyansna',
  'https://tiktok.com/@libyansna',
  now(),
  'seed'
) on conflict (id) do nothing;

-- Super admin — email: admin@libyansna.org / password: Admin12345!
-- Change the password after the first sign-in.
insert into public.admins (email, name, password_hash, role, active)
values (
  'admin@libyansna.org',
  'Site Director',
  'scrypt:c9601bce9dfb5a8288d298ccadd0c7d7:e5c656ec588d895aea6c9c1390c986a07079e02ab69a115e3f04e7379b71ba3bc8646288aaf150e577a2c6c40eb6ec3ded694a21d7f9925bfcac852b5bfec03e',
  'super_admin',
  true
) on conflict (email) do nothing;

insert into public.admins (email, name, password_hash, role, active)
values (
  'events@libyansna.org',
  'Events Desk',
  'scrypt:c9601bce9dfb5a8288d298ccadd0c7d7:e5c656ec588d895aea6c9c1390c986a07079e02ab69a115e3f04e7379b71ba3bc8646288aaf150e577a2c6c40eb6ec3ded694a21d7f9925bfcac852b5bfec03e',
  'events_manager',
  true
) on conflict (email) do nothing;

insert into public.volunteer_questions (key, prompt_en, prompt_ar, type, options, sort_order)
values
  (
    'active_member',
    'Would you like to be an active member of the community when your people need you?',
    'هل ترغب أن تكون عضواً فعالاً في الجالية حين يحتاجك أبناء وطنك؟',
    'boolean',
    '[{"value":"yes","labelEn":"Yes","labelAr":"نعم"},{"value":"no","labelEn":"No","labelAr":"لا"}]'::jsonb,
    1
  ),
  (
    'teamwork',
    'Do you prefer working with a team or completing work on your own?',
    'هل تحب العمل الجماعي أم تفضّل أن تؤدي العمل بنفسك؟',
    'single_select',
    '[{"value":"team","labelEn":"I love working with a team","labelAr":"أحب العمل الجماعي"},{"value":"solo","labelEn":"I prefer working on my own","labelAr":"أحب أن أعمل بمفردي"}]'::jsonb,
    2
  ),
  (
    'travel',
    'Where can you volunteer?',
    'أين يمكنك التطوع؟',
    'single_select',
    '[{"value":"city","labelEn":"In my city only","labelAr":"في مدينتي فقط"},{"value":"state","labelEn":"In my city or state","labelAr":"في مدينتي أو ولايتي فقط"},{"value":"anywhere","labelEn":"I can travel to other states","labelAr":"يمكنني السفر للتطوع في ولايات أخرى"}]'::jsonb,
    3
  )
on conflict (key) do nothing;

insert into public.posts (slug, kind, title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar, cover_image, country, state_code, city, author_name, status, featured, published_at)
values
  (
    'welcome-to-the-community-platform',
    'news',
    'A shared home for the Libyan community in North America',
    'بيت جامع للجالية الليبية في أمريكا الشمالية',
    'This platform connects Libyan families across the United States and Canada, and introduces the world to what our community builds.',
    'هذه المنصة تربط العائلات الليبية في الولايات المتحدة وكندا، وتعرف العالم بما تبنيه جاليتنا.',
    'Welcome. This is a community-built platform with one purpose: that Libyans in North America know each other, and that the world knows who we are.' || chr(10) || chr(10) || 'Members can complete a family profile, join the directory, propose ideas, and follow the community fund in their state. Visitors can read the news, follow events, and see the work of the diaspora.',
    'مرحباً بكم. هذه منصة بناها المجتمع لهدف واحد: أن يعرف الليبيون في أمريكا الشمالية بعضهم، وأن يعرف العالم من نحن.' || chr(10) || chr(10) || 'يستطيع الأعضاء إكمال ملف العائلة والانضمام إلى الدليل وطرح الأفكار ومتابعة صندوق الجالية في ولايتهم. أما الزوار فيمكنهم قراءة الأخبار ومتابعة المناسبات والتعرف على أعمال الجالية.',
    '/images/stories/iftar.svg',
    'US',
    'MI',
    'Dearborn',
    'Community Desk',
    'published',
    true,
    now() - interval '2 days'
  ),
  (
    'community-fund-how-it-works',
    'guide',
    'How the state community fund works',
    'كيف يعمل صندوق الجالية في كل ولاية',
    'Ten dollars a month per family, a volunteer committee, and a public report of every dollar spent.',
    'عشرة دولارات شهرياً من كل عائلة، ولجنة تطوعية، وتقرير معلن عن كل دولار يُصرف.',
    'Each state or province runs its own fund. Families contribute up to $10 a month through this site, and a volunteer committee publishes a report of income and expenses. Reports are delivered to every member in that state through the inbox.' || chr(10) || chr(10) || 'The money is spent on community events, scholarships, and quiet support for families in difficulty.',
    'لكل ولاية أو مقاطعة صندوقها الخاص. تساهم العائلات بما يصل إلى 10 دولارات شهرياً عبر هذا الموقع، وتنشر لجنة تطوعية تقريراً بالواردات والمصروفات. تصل التقارير إلى كل عضو في تلك الولاية عبر صندوق الوارد.' || chr(10) || chr(10) || 'تُصرف الأموال على مناسبات الجالية والمنح الدراسية والدعم الهادئ للعائلات المتعثرة.',
    null,
    null,
    null,
    null,
    'Community Desk',
    'published',
    false,
    now() - interval '6 days'
  )
on conflict (slug) do nothing;

insert into public.events (
  title_en, title_ar, body_en, body_ar, image_url, announce_until,
  ticker_enabled, ticker_text_en, ticker_text_ar, ticker_bg_color, ticker_text_color, ticker_until, created_by
)
select
  'Eid family gathering — Dearborn',
  'تجمع العيد لعائلات الجالية — ديربورن',
  'Prayer, breakfast, and a children''s programme. Bring a dish to share; the community fund covers the hall and drinks.',
  'الصلاة والفطور وبرنامج للأطفال. نرجو إحضار طبق للمشاركة؛ صندوق الجالية يغطي القاعة والمشروبات.',
  '/images/stories/eid.svg',
  now() + interval '12 days',
  true,
  'Eid family gathering in Dearborn — everyone is welcome',
  'تجمع العيد لعائلات الجالية في ديربورن — الجميع مرحب به',
  '#0b4f6c',
  '#ffffff',
  now() + interval '26 days',
  'Events Desk'
where not exists (select 1 from public.events limit 1);
