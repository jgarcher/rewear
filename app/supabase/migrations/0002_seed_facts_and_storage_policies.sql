-- ================================================
-- Migration 0002 — seed DYK facts + storage policies
-- ================================================

-- Storage RLS for wardrobe-photos bucket
-- Users can upload/update/delete only files in their own folder (named by their user_id).
-- Anyone can read (bucket is public for v1).

create policy "users upload own wardrobe photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own wardrobe photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own wardrobe photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ================================================
-- Seed Did You Know facts (15 sourced facts)
-- Source: seed/did-you-know.json
-- ================================================

insert into did_you_know_facts (fact, source, source_publication, source_year, source_url, category, confidence) values
  ('The average garment is worn between 7 and 10 times before being discarded.',
   'Ellen MacArthur Foundation', 'A New Textiles Economy: Redesigning fashion''s future', 2017,
   'https://ellenmacarthurfoundation.org/a-new-textiles-economy', 'behaviour', 'peer-reviewed'),

  ('Fashion produces around 8% of global carbon emissions — more than aviation and shipping combined.',
   'UNECE / Quantis', 'Measuring Fashion 2018', 2018,
   'https://quantis.com/report/measuring-fashion-report/', 'carbon', 'industry-report'),

  ('It takes around 2,700 litres of water to produce one cotton t-shirt — about 3 years of drinking water for one person.',
   'WRAP UK / WWF', 'The Impact of a Cotton T-Shirt', 2013,
   'https://www.worldwildlife.org/stories/the-impact-of-a-cotton-t-shirt', 'water', 'industry-report'),

  ('Extending the active life of a garment by just 9 months reduces its carbon, water, and waste footprints by around 20–30%.',
   'WRAP UK', 'Valuing Our Clothes', 2017,
   'https://wrap.org.uk/resources/report/valuing-our-clothes-cost-uk-fashion', 'behaviour', 'peer-reviewed'),

  ('Less than 1% of the material used to make clothing is recycled into new clothing.',
   'Ellen MacArthur Foundation', 'A New Textiles Economy', 2017,
   'https://ellenmacarthurfoundation.org/a-new-textiles-economy', 'circular', 'peer-reviewed'),

  ('The fashion industry uses around 93 billion cubic metres of water a year — enough to meet the household needs of 5 million people.',
   'Ellen MacArthur Foundation', 'A New Textiles Economy', 2017,
   'https://ellenmacarthurfoundation.org/a-new-textiles-economy', 'water', 'peer-reviewed'),

  ('A single pair of cotton jeans uses around 7,500 litres of water to produce — nearly 7 years of drinking water for one person.',
   'UN Environment Programme', 'UN Alliance for Sustainable Fashion', 2019,
   'https://unfashionalliance.org/', 'water', 'industry-report'),

  ('Polyester clothing sheds around 500,000 tonnes of microfibres into oceans every year — about 50 billion plastic bottles'' worth.',
   'Ellen MacArthur Foundation', 'A New Textiles Economy', 2017,
   'https://ellenmacarthurfoundation.org/a-new-textiles-economy', 'microplastic', 'peer-reviewed'),

  ('Around £140 million worth of clothing ends up in UK landfill each year — about 350,000 tonnes.',
   'WRAP UK', 'Valuing Our Clothes', 2017,
   'https://wrap.org.uk/resources/report/valuing-our-clothes-cost-uk-fashion', 'economic', 'peer-reviewed'),

  ('The second-hand clothing market is growing roughly nine times faster than the new clothing market.',
   'ThredUp', 'Resale Report', 2023,
   'https://www.thredup.com/resale/', 'economic', 'industry-report'),

  ('Producing one kilogram of new cotton emits around 5.5 kg of CO₂. Re-wearing what you already own avoids that.',
   'Higg Materials Sustainability Index v3', 'Higg MSI', 2023,
   'https://msi.higg.org/', 'carbon', 'industry-report'),

  ('Around 30% of clothes in UK wardrobes haven''t been worn for at least a year.',
   'WRAP UK', 'Valuing Our Clothes', 2017,
   'https://wrap.org.uk/resources/report/valuing-our-clothes-cost-uk-fashion', 'behaviour', 'peer-reviewed'),

  ('The average person in the UK buys around 26 garments a year — more than double the European average.',
   'WRAP UK', 'Textiles 2030', 2021,
   'https://wrap.org.uk/taking-action/textiles/initiatives/textiles-2030', 'behaviour', 'industry-report'),

  ('If every UK household kept their clothes for one year longer, it would be the equivalent of taking around 700,000 cars off the road.',
   'WRAP UK', 'Valuing Our Clothes', 2017,
   'https://wrap.org.uk/resources/report/valuing-our-clothes-cost-uk-fashion', 'carbon', 'peer-reviewed'),

  ('Buying half your wardrobe second-hand instead of new can cut your annual fashion footprint by around 40%.',
   'WRAP UK / Ellen MacArthur Foundation', 'Valuing Our Clothes / A New Textiles Economy', 2017,
   'https://wrap.org.uk/resources/report/valuing-our-clothes-cost-uk-fashion', 'circular', 'peer-reviewed');
