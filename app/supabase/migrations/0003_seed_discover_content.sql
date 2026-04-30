-- ============================================================
-- Migration 0003 — seed Discover content
-- (eco brands, upcycle tutorials, donation locations)
-- Targeting Amsterdam-area for donation locations
-- (Anna-Liv is in Amstelveen).
-- ============================================================

-- ============= Eco Brands =============

insert into eco_brands (name, description, tags, website_url, category, submission_status) values
  ('Patagonia', 'Pioneer in sustainable outdoor clothing. Uses recycled materials and runs a take-back programme through Worn Wear.',
   array['recycled-materials','fair-trade','repair-programme','take-back'],
   'https://www.patagonia.com', 'outdoor', 'verified'),

  ('Eileen Fisher', 'Timeless, minimalist designs in organic and recycled fibres. Renew programme buys back used pieces.',
   array['organic','take-back','recycled-materials'],
   'https://www.eileenfisher.com', 'minimal', 'verified'),

  ('Reformation', 'Sustainable women''s clothing made from deadstock and eco-friendly fabrics. Carbon-neutral shipping.',
   array['deadstock','low-waste','carbon-neutral'],
   'https://www.thereformation.com', 'feminine', 'verified'),

  ('Everlane', 'Radical transparency in pricing and sourcing. Ethical factories and clean materials.',
   array['transparent-pricing','ethical-factories','clean-materials'],
   'https://www.everlane.com', 'basics', 'verified'),

  ('Pangaia', 'Materials-science fashion using innovative bio-based fibres. Each garment lists its sustainability metrics.',
   array['bio-materials','low-water','carbon-tracked'],
   'https://thepangaia.com', 'modern', 'verified'),

  ('Stella McCartney', 'Luxury without leather, fur, or feathers. Pioneer in vegan and regenerative materials.',
   array['vegan','regenerative','luxury'],
   'https://www.stellamccartney.com', 'luxury', 'verified'),

  ('Rapanui', 'British basics in 100% organic cotton with traceable supply chain and circular take-back.',
   array['organic','take-back','traceable'],
   'https://rapanuiclothing.com', 'basics', 'verified'),

  ('Rixo', 'Hand-illustrated prints inspired by vintage finds. Slow production runs in limited quantities.',
   array['slow-fashion','small-batch','vintage-inspired'],
   'https://www.rixo.co.uk', 'feminine', 'verified'),

  ('People Tree', 'Fair Trade certified throughout. One of the original sustainable fashion houses.',
   array['fair-trade','organic','women-led-cooperatives'],
   'https://www.peopletree.co.uk', 'everyday', 'verified'),

  ('Veja', 'Trainers made with organic cotton, wild Amazonian rubber, and recycled plastic. No marketing spend.',
   array['organic','recycled-materials','fair-trade'],
   'https://www.veja-store.com', 'shoes', 'verified'),

  ('Mud Jeans', 'Circular denim — lease your jeans or buy from recycled cotton. Take-back guaranteed.',
   array['circular','recycled-denim','take-back'],
   'https://mudjeans.eu', 'denim', 'verified'),

  ('Kings of Indigo', 'Amsterdam-based. Indigo denim and basics in organic, recycled, and Fairtrade fabrics.',
   array['organic','recycled-materials','fair-trade','dutch'],
   'https://kingsofindigo.com', 'denim', 'verified');

-- ============= Upcycle Tutorials =============

insert into upcycle_tutorials (title, difficulty, time_required, materials_needed, steps, applicable_categories) values
  ('Jeans into cut-off shorts',
   'beginner',
   '20 minutes',
   array['Old jeans','Sharp scissors','Chalk or fabric pen','Ruler'],
   '[
     {"step": 1, "title": "Try them on", "description": "Mark the cut line about 5cm below where you want the final hem to sit. Add an extra inch for fraying."},
     {"step": 2, "title": "Cut", "description": "Use sharp scissors. Cut both legs at the marked line, then check by holding the legs together — adjust if uneven."},
     {"step": 3, "title": "Fray the edges (optional)", "description": "Pull at the white horizontal threads to expose them. Wash the shorts to lock in the fray."},
     {"step": 4, "title": "Roll the cuff", "description": "Fold up about 2cm twice. Iron flat or leave loose for a more relaxed look."}
   ]'::jsonb,
   array['bottom']),

  ('T-shirt into a tote bag (no sewing)',
   'beginner',
   '15 minutes',
   array['Old t-shirt','Sharp scissors','Chalk'],
   '[
     {"step": 1, "title": "Cut off the sleeves", "description": "Cut along the inside of the seam — the resulting holes become the bag handles."},
     {"step": 2, "title": "Open the neckline", "description": "Cut a wider U-shape at the neckline. This becomes the bag opening."},
     {"step": 3, "title": "Turn inside out and mark the bottom", "description": "Mark a horizontal line about 3cm above the hem — this is the cut depth for the fringe."},
     {"step": 4, "title": "Cut a fringe", "description": "Cut vertical strips up to your line, every 2cm. Tie corresponding front and back strips together with double knots. The knots seal the bag bottom."}
   ]'::jsonb,
   array['tshirt','top']),

  ('Sashiko visible mending',
   'intermediate',
   '60–90 minutes',
   array['Garment with a hole or thin patch','Sashiko thread (or strong cotton)','Sashiko needle','Embroidery hoop','Iron-on patch (light)','Scissors'],
   '[
     {"step": 1, "title": "Stabilise the area", "description": "Iron a light patch to the inside of the garment, behind the hole or thin spot."},
     {"step": 2, "title": "Mark a grid", "description": "Use chalk to mark a regular grid over the area. Sashiko stitches follow these lines — usually horizontal rows, 3–5mm spacing."},
     {"step": 3, "title": "Stitch in straight rows", "description": "Running stitch, picking up 2–3mm of fabric on the needle then leaving 2–3mm gap. Aim for even spacing — perfection isn''t the goal, rhythm is."},
     {"step": 4, "title": "Lock the ends", "description": "Bring the thread to the inside, do a small backstitch, and trim. The repair becomes a feature."}
   ]'::jsonb,
   array['top','tshirt','bottom','dress','coat']),

  ('Tie-dye refresh with natural dyes',
   'beginner',
   '2 hours (plus drying)',
   array['Faded white or cream cotton garment','Natural dye (avocado pits = pink; turmeric = yellow; black tea = beige)','Salt or vinegar (mordant)','Rubber bands','Large pot','Rubber gloves'],
   '[
     {"step": 1, "title": "Pre-soak", "description": "Soak the garment in water with a tablespoon of salt for 30 minutes."},
     {"step": 2, "title": "Bind with rubber bands", "description": "Twist or fold the fabric and bind tightly with rubber bands wherever you want resist patterns."},
     {"step": 3, "title": "Make the dye bath", "description": "Simmer your chosen natural dye in water for 30 minutes. Strain out solids."},
     {"step": 4, "title": "Dye", "description": "Submerge the bound garment in the warm dye bath. Simmer gently for 30–60 minutes — longer for deeper colour."},
     {"step": 5, "title": "Rinse and dry", "description": "Remove rubber bands. Rinse cold until water runs clear. Hang to dry out of direct sun."}
   ]'::jsonb,
   array['top','tshirt','dress']),

  ('Hem an oversized dress to a midi',
   'intermediate',
   '45 minutes',
   array['Long dress that drags','Sharp dressmaking scissors','Pins','Sewing machine or hand-sewing needle','Matching thread','Iron'],
   '[
     {"step": 1, "title": "Try on with shoes", "description": "Pin the new hem with the dress on, accounting for the shoes you''ll wear it with. Mark all the way around."},
     {"step": 2, "title": "Cut", "description": "Add 3cm below the marked line for the hem allowance. Cut on a flat surface, keeping the line straight."},
     {"step": 3, "title": "Press a double-fold hem", "description": "Fold up 1cm, press. Fold up another 2cm, press again. Pin in place."},
     {"step": 4, "title": "Stitch", "description": "Sew along the inside fold either by machine (straight stitch) or by hand (slip stitch for invisibility)."}
   ]'::jsonb,
   array['dress','bottom']),

  ('Boro patchwork repair',
   'intermediate',
   '90 minutes',
   array['Garment with worn patches','Scraps of similar fabric (denim on denim, cotton on cotton)','Sashiko or strong thread','Needle','Iron','Pins'],
   '[
     {"step": 1, "title": "Choose patch fabric", "description": "Use scraps from worn-out garments — torn jeans, old shirts. Different shades and patterns are part of the boro aesthetic."},
     {"step": 2, "title": "Layer and pin", "description": "Layer the patch behind (or on top of) the worn area. Pin securely. The patch can be larger than the worn spot."},
     {"step": 3, "title": "Stitch in rows", "description": "Use running stitch in straight horizontal rows across the patch. Stitches should pick up both fabrics. Don''t worry about perfection."},
     {"step": 4, "title": "Add more layers over time", "description": "Boro is meant to be repeated — as more patches wear, layer new ones on top. The garment becomes denser and more textured with each repair."}
   ]'::jsonb,
   array['top','bottom','coat']);

-- ============= Donation Locations (Amsterdam area) =============

insert into donation_locations (partner_name, address, lat, lng, accepts, notes) values
  ('Sympany clothing bin',
   'Various locations across Amstelveen',
   52.3036, 4.8472,
   array['all clothing','shoes','bags','textiles'],
   'Yellow Sympany containers in supermarket car parks. Wearable and unwearable accepted.'),

  ('H&M Garment Collecting',
   'H&M Amstelveen Stadshart, Stadsplein 73',
   52.3047, 4.8546,
   array['all clothing','any brand','any condition'],
   'Drop off any brand at H&M stores in exchange for a 15% off voucher.'),

  ('Leger des Heils ReShare',
   'Various locations across Amsterdam',
   52.3676, 4.9041,
   array['all clothing','shoes','accessories'],
   'Salvation Army Netherlands — proceeds fund social projects. Pick-up available for larger donations.'),

  ('Episode Vintage',
   'Waterlooplein 1, Amsterdam',
   52.3676, 4.9041,
   array['vintage','quality second-hand','denim','outerwear'],
   'Vintage shop that buys curated second-hand. Bring items in good condition for cash or store credit.'),

  ('Sympany Drop-off Point',
   'Albert Heijn Amstelveen, Boekenroodeweg',
   52.3007, 4.8636,
   array['all clothing','shoes'],
   'Convenient daily drop-off at AH supermarket. Look for the yellow Sympany bin near the entrance.'),

  ('Refugee Company — Wear It Forward',
   'Bijlmerdreef 1289, Amsterdam',
   52.3145, 4.9550,
   array['quality clothing','professional wear','children''s clothing'],
   'Donations support refugees building careers in fashion. Quality items preferred.'),

  ('Kringloop Amstelveen',
   'Bourgondischelaan 32, Amstelveen',
   52.3026, 4.8608,
   array['all clothing','shoes','household items'],
   'Local thrift shop. Drop off in person during opening hours. Items resold to fund community projects.'),

  ('Charity shop — Het Goed',
   'Van Hallstraat 333, Amsterdam',
   52.3859, 4.8772,
   array['all clothing','shoes','books','household'],
   'Het Goed is a Dutch chain of thrift shops. Several locations across Amsterdam.');
