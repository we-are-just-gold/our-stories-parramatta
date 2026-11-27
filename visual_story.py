"""The visual story page: the day at Our Stories, one step at a time, in pictures.
Venue details come from City of Parramatta's PHIVE and Parramatta Library visual stories (made with Aspect)
and from the welcome pack. Called from build.py."""

NAVY, CORAL, HEAR, LUNCH, CREATE, SHARE, TAUPE, PERI = (
    '#0C0E3D', '#EF4B35', '#5CC8F7', '#FF7AB8', '#2FD17C', '#5B1E9E', '#CDB1AF', '#8891D8')


def pic(inner, ring='#fff'):
    return ('<svg class="vs-svg" aria-hidden="true" focusable="false" viewBox="0 0 240 180">'
            f'<circle cx="204" cy="158" r="74" fill="none" stroke="{ring}" stroke-width="20" opacity=".6"/>'
            f'<g fill="none" stroke="{NAVY}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'
            f'{inner}</g></svg>')


def person(x, y, fill, r=12):
    return (f'<path d="M{x - 19} {y + 48}v-10a19 19 0 0 1 38 0v10z" fill="{fill}"/>'
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>')


PICS = {
    'day': pic(
        '<rect x="66" y="42" width="108" height="104" rx="14" fill="#fff"/>'
        f'<path d="M66 78V56a14 14 0 0 1 14-14h80a14 14 0 0 1 14 14v22z" fill="{CORAL}"/>'
        '<path d="M94 30v22M146 30v22"/>'
        f'<text x="120" y="130" text-anchor="middle" font-size="46" font-weight="700" fill="{NAVY}" stroke="none">28</text>'),
    'travel': pic(
        '<path d="M30 150h180"/>'
        '<rect x="58" y="88" width="124" height="62" fill="#fff"/>'
        f'<path d="M50 88l17-30 17 30 17-30 17 30 17-30 17 30 17-30 17 30z" fill="{CORAL}"/>'
        f'<rect x="108" y="112" width="24" height="38" fill="{HEAR}"/>'
        '<path d="M74 108h18M148 108h18M74 126h18M148 126h18"/>'
        f'<path d="M206 150v-26"/><circle cx="206" cy="112" r="16" fill="{CREATE}"/>'),
    'door': pic(
        f'<rect x="56" y="28" width="128" height="104" rx="6" fill="{HEAR}"/>'
        '<path d="M120 28v104M108 74v18M132 74v18M36 132h168"/>'
        '<path d="M120 172v-24M108 158l12-12 12 12"/>'),
    'lift': pic(
        f'<rect x="38" y="52" width="92" height="100" rx="6" fill="{TAUPE}"/>'
        '<path d="M84 52v100M26 152h188"/>'
        f'<circle cx="84" cy="28" r="17" fill="#fff"/>'
        f'<text x="84" y="36" text-anchor="middle" font-size="22" font-weight="700" fill="{NAVY}" stroke="none">4</text>'
        '<path d="M146 152h20v-22h20v-22h20v-22"/>'
        '<path d="M160 76l20-20M166 56h14v14"/>'),
    'desk': pic(
        person(120, 50, PERI, 14)
        + '<rect x="110" y="78" width="20" height="14" rx="3" fill="#fff"/>'
        + f'<rect x="34" y="100" width="172" height="50" rx="10" fill="{CORAL}"/>'
        + '<path d="M22 150h196"/>'
        + '<rect x="150" y="72" width="40" height="28" rx="5" fill="#fff"/><path d="M160 82h20M160 90h12"/>'),
    'camera': pic(
        '<path d="M82 60l8-16h36l8 16"/>'
        '<rect x="40" y="60" width="136" height="88" rx="14" fill="#fff"/>'
        f'<circle cx="108" cy="104" r="28" fill="{HEAR}"/><circle cx="108" cy="104" r="11" fill="{NAVY}"/>'
        f'<circle cx="186" cy="54" r="30" fill="{LUNCH}"/>'
        '<path d="M168 72l36-36"/>'),
    'phone': pic(
        '<rect x="78" y="18" width="84" height="144" rx="16" fill="#fff"/>'
        f'<g fill="{NAVY}" stroke="none"><rect x="94" y="40" width="20" height="20"/><rect x="126" y="40" width="20" height="20"/>'
        '<rect x="94" y="72" width="20" height="20"/><rect x="126" y="72" width="9" height="9"/><rect x="137" y="83" width="9" height="9"/></g>'
        f'<rect x="92" y="114" width="56" height="24" rx="12" fill="{CORAL}"/>'),
    'hear': pic(
        person(64, 56, '#fff', 14)
        + '<path d="M112 28h84a12 12 0 0 1 12 12v32a12 12 0 0 1-12 12h-58l-18 16v-16h-8a12 12 0 0 1-12-12V40a12 12 0 0 1 12-12z" fill="#fff" transform="translate(0 0)"/>'
        + '<path d="M124 48h66M124 64h44"/>'
        + f'<circle cx="112" cy="146" r="13" fill="{NAVY}"/><circle cx="152" cy="146" r="13" fill="{NAVY}"/><circle cx="192" cy="146" r="13" fill="{NAVY}"/>',
        ring=NAVY),
    'lunch': pic(
        '<circle cx="112" cy="96" r="52" fill="#fff"/><circle cx="112" cy="96" r="30" fill="#fff"/>'
        '<path d="M34 46v26a9 9 0 0 0 18 0V46M43 46v100"/>'
        f'<path d="M196 40v62"/><circle cx="184" cy="106" r="12" fill="{NAVY}"/><path d="M196 40l20 8v16l-20-8z" fill="{NAVY}"/>',
        ring=NAVY),
    'create': pic(
        '<rect x="52" y="24" width="104" height="132" rx="12" fill="#fff"/>'
        '<path d="M72 56h64M72 80h64M72 104h36"/>'
        '<g transform="rotate(38 172 104)"><rect x="161" y="40" width="24" height="96" rx="5" fill="#fff"/>'
        f'<path d="M161 136l12 24 12-24z" fill="{NAVY}"/></g>',
        ring=NAVY),
    'share': pic(
        f'<circle cx="120" cy="90" r="50" stroke="#fff" stroke-width="8"/>'
        + ''.join(f'<circle cx="{x}" cy="{y}" r="15" fill="{f}"/>' for x, y, f in (
            (120, 34, '#fff'), (170, 62, HEAR), (170, 118, LUNCH), (120, 146, '#fff'), (70, 118, CREATE), (70, 62, TAUPE))),
        ring='#fff'),
    'quiet': pic(
        f'<path d="M80 124V92a18 18 0 0 1 18-18h44a18 18 0 0 1 18 18v32z" fill="{PERI}"/>'
        '<rect x="58" y="100" width="26" height="46" rx="12" fill="#fff"/><rect x="156" y="100" width="26" height="46" rx="12" fill="#fff"/>'
        '<rect x="84" y="116" width="72" height="30" rx="8" fill="#fff"/>'
        '<path d="M76 146v14M164 146v14"/>'
        f'<circle cx="196" cy="44" r="24" fill="{CREATE}"/><path d="M188 34v20M204 34v20"/>'),
    'leave': pic(
        f'<rect x="42" y="30" width="86" height="122" rx="6" fill="{HEAR}"/>'
        '<path d="M26 152h188M85 30v122"/>'
        '<path d="M144 104h58M184 86l18 18-18 18"/>'
        f'<circle cx="170" cy="52" r="14" fill="{CREATE}"/>'),
}

COUNCIL = 'https://www.cityofparramatta.nsw.gov.au/files/assets/public/v/1/publications/phive-visual-story-june-2026.pdf'
# step key: file, width, height, alt text, caption. All photos are City of Parramatta's.
PHOTOS = {
    'travel': ('venue-outside.jpg', 624, 415,
               'PHIVE seen from Parramatta Square. It has a red roof with a pattern of raised tiles. Parramatta Town Hall is on the left. People are walking and sitting in the square.',
               'PHIVE from Parramatta Square. Parramatta Town Hall is on the left.'),
    'door': ('venue-entrance.jpg', 565, 275,
             'The front of PHIVE. Red signs above the doors say Parramatta Library and PHIVE. The large glass doors on the left are open. The automatic sliding door is on the right.',
             'The main entrance. The large glass doors are on the left. The automatic sliding door is on the right.'),
    'lift': ('venue-lifts.jpg', 633, 331,
             'The Ground Floor foyer of PHIVE, with orange chairs and plants. A red arrow points to a glass lift. A second red arrow points to the glass doors that lead to the stairs.',
             'The foyer on the Ground Floor. The red arrows point to the lifts, on the left, and to the doors for the stairs, on the right.'),
    'hear': ('venue-civic-gallery.jpg', 624, 466,
             'The Civic Gallery. A long room with tall windows along one side, a white folded ceiling and an orange carpet. It is set up with one long table and wooden chairs.',
             'The Civic Gallery, set up for a different event.'),
}

ICON = {
    'sound': '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
    'people': '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 7.5-1.5"/>',
    'camera': '<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
    'food': '<path d="M4 13h16a8 8 0 0 1-16 0zM8 9c0-2 2-2 2-4M13 9c0-2 2-2 2-4"/>',
    'light': '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    'ok': '<circle cx="12" cy="12" r="9"/><path d="m7.5 12.5 3 3 6-7"/>',
    'calm': '<path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l8-8"/>',
}


def chip(kind, text):
    return (f'<li class="vs-chip k-{kind}"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="22" height="22" fill="none" '
            f'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[kind]}</svg>{text}</li>')


# key, picture, panel colour class, when, heading, paragraphs, chips, extra html
STEPS = [
    ('day', '', 'Saturday 28 November 2026', 'I am going to Our Stories',
     ['Our Stories is a day of hearing stories and telling stories.',
      'It is at PHIVE, in Parramatta.'],
     [('ok', 'I can come to one session, two or all three')], ''),
    ('travel', '', 'Getting there', 'I travel to PHIVE',
     ['PHIVE is at 5 Parramatta Square. It is the building with the red roof, next to Parramatta Town Hall.',
      'It is a two minute walk from Parramatta station.'],
     [],
     '<details class="vs-more"><summary>Directions by train, light rail, bus and car</summary>'
     '<p><strong>Train.</strong> I tap off and turn right at the Parramatta Square sign. Harvey’s Hot Sandwiches is on my left. '
     'I walk straight to the silver bus sculpture, then turn left. PHIVE is the building with the red roof.</p>'
     '<p><strong>Light rail.</strong> From the Macquarie Street stop I turn right and walk about 50 metres. '
     'I turn left into the first laneway, with the NAB sign on my left. I walk straight. PHIVE is on my right.</p>'
     '<p><strong>Bus.</strong> From the Argyle Street stops I find the Huss Newsstand. I take the escalators or the stairs down and turn left. '
     'Then I follow the train directions.</p>'
     '<p><strong>Car.</strong> There is a drop off zone in front of the entrance doors. The Parramatta Square Carpark entrance ramp is on Darcy Street, '
     'just after the corner of Smith Street. It is paid, with no ticket and no cash. Other car parks are in the <a href="/welcome#venue">welcome pack</a>.</p>'
     '<p>Photos of each route are in <a href="' + COUNCIL + '">City of Parramatta’s visual story for PHIVE</a>.</p>'
     '</details>'),
    ('door', '', 'Going in', 'I go in the main entrance',
     ['I walk in from Parramatta Square, through the large glass doors or the automatic sliding door.',
      'Now I am in the foyer on the Ground Floor. The Customer Service desk is on my right.'],
     [('people', 'The foyer can be busy')], ''),
    ('lift', '', 'Going up', 'I take the lift or the stairs to Level 4',
     ['Our Stories is in the Civic Gallery, on Level 4.',
      'The stairs are through the double glass doors beside the lifts.'],
     [('people', 'Lifts can be crowded. People might bump into me')], ''),
    ('desk', '', 'From 9.30am', 'I sign in at the welcome desk',
     ['The welcome desk is on Level 4. I say my name and I get a name badge.',
      'Volunteers wear a black shirt and a badge. I can ask them for help.'],
     [('ok', 'If I have an allergy, I tell the welcome desk')], ''),
    ('camera', '', 'Photos and filming', 'I choose if I am in photos',
     ['People are taking photos and video today.',
      'If I do not want to be in them, I ask for a bright sticker at the welcome desk. Saying no is easy.'],
     [('camera', 'Cameras are in the room')],
     '<p class="vs-link"><a href="/consent">Open the consent form</a></p>'),
    ('phone', '', 'When I arrive', 'I open the app on my phone',
     ['I point my phone camera at the QR code. Then I tap Start your day.',
      'It asks 10 short questions. It does not ask my name.'],
     [('ok', 'No phone? Paper copies are at the welcome desk')],
     '<p class="vs-link"><a href="/arrival-survey">Start your day</a></p>'),
    ('hear', 'c-hear', '10am to 12pm', 'Hear',
     ['I sit in the Civic Gallery. It starts with a Welcome to Country.',
      'People talk about belonging in Parramatta. There is a performance. We answer a poll on our phones.'],
     [('sound', 'Talking and a performance'), ('ok', 'I can just listen')], ''),
    ('lunch', 'c-lunch', '12pm to 12.45pm', 'Lunch',
     ['Lunch is in the foyer of the Civic Gallery. It is for everyone who comes to any session.',
      'All the food is halal. There are gluten free, vegetarian and vegan options.'],
     [('sound', 'Dance, a flute and an electric guitar'), ('food', 'The smell of food'), ('people', 'People eating and talking')], ''),
    ('create', 'c-create', '12.45pm to 2.45pm', 'Create',
     ['I work on my own story in a workshop.',
      'People aged 15 to 25 have their own session, with writing and performance.'],
     [('ok', 'I only share what I want to share'), ('ok', 'I can use my mother tongue')], ''),
    ('share', 'c-share', '3pm to 5pm', 'Share',
     ['We sit in small circles. I can tell my story, or I can listen. Listening is taking part.',
      'Some people tell a story on the stage. That only happens if they choose it.'],
     [('ok', 'Some stories bring things up. That is normal')], ''),
    ('quiet', '', 'Any time', 'I can take a break',
     ['I can leave any session when I need to, and come back when I am ready.',
      'The quiet space is in the foyer on Level 4. A counsellor is here from about 11am.'],
     [('calm', 'Quiet space, Level 4'), ('calm', 'Prayer room, Level 3'), ('calm', 'Seats outside, near trees and grass')], ''),
    ('leave', '', 'Going home', 'I leave when I am ready',
     ['Before I go, I tap End your day in the app.',
      'I take the lift or the stairs to the Ground Floor and walk out through the glass doors. If the sliding door is closed, I press the green button.'],
     [],
     '<p class="vs-link"><a href="/end-of-day-survey">End your day</a></p>'),
]


def build(page, hero, row):
    n = len(STEPS)
    cards = []
    for i, (key, cls, when, title, paras, chips, extra) in enumerate(STEPS, 1):
        chips_html = ('<ul class="vs-chips">' + ''.join(chip(k, t) for k, t in chips) + '</ul>') if chips else ''
        photo = ''
        if key in PHOTOS:
            fn, w, h, alt, cap = PHOTOS[key]
            photo = (f'<figure class="vs-photo"><img src="/img/{fn}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
                     f'<figcaption>{cap} <span>Photo: City of Parramatta.</span></figcaption></figure>')
        cards.append(
            f'<li class="vs-step {cls}" id="step-{i}">'
            f'<div class="vs-pic">{PICS[key]}</div>'
            f'<div class="vs-txt"><p class="vs-n"><span class="vs-num">{i}</span><span class="vh"> of {n}. </span><span class="vs-when">{when}</span></p>'
            f'<h2>{title}</h2>'
            + ''.join(f'<p>{p}</p>' for p in paras) + photo + chips_html + extra + '</div></li>')

    body = hero('Visual story', 'My day at', 'Our Stories.',
                'What I will see and do at PHIVE on Saturday 28 November 2026. One step at a time, in pictures.',
                extra='\n<p class="printlink vs-top"><a class="btn small" href="#step-1">Start at step 1</a>'
                      '<a class="btn ghost small" href="#feel">What the day may feel like</a>'
                      '<button type="button" class="btn ghost small" onclick="window.print()">Print a paper copy</button></p>') + f'''
<section class="section vs" aria-label="The day, step by step">
<div class="wrap">
<ol class="vs-steps">
{chr(10).join(cards)}
</ol>
</div>
</section>

<section class="section tint" id="feel">
<div class="wrap">
<p class="label">Sound, people and light</p>
<h2>What the day may feel like</h2>
<p class="intro">This is what I may notice, and when.</p>
<ol class="glance">
{row('Arriving', 'The foyer and the lifts can be busy. People might bump into me.', 'Ground Floor and lifts')}
{row('Hear, 10am', 'People talking on stage, and a performance.', 'Civic Gallery, Level 4')}
{row('Lunch, 12pm', 'Dance and music, people eating and talking, and the smell of food.', 'Civic Gallery foyer')}
{row('Create, 12.45pm', 'A workshop. People work on their own stories.', 'Civic Gallery')}
{row('Share, 3pm', 'Small circles. Some stories bring things up. That is normal.', 'Civic Gallery, Level 4')}
{row('All day', 'People taking photos and video. Some spaces in PHIVE have bright lights.')}
</ol>
<div class="two vs-two">
<div>
<h3>Things I can bring</h3>
<ul class="list">
<li>Headphones or earplugs</li>
<li>Fidgets</li>
<li>Sunglasses</li>
</ul>
</div>
<div>
<h3>Places that are calmer</h3>
<ul class="list">
<li><strong>Quiet space, Level 4.</strong> In the foyer. Open all day.</li>
<li><strong>Prayer room, Level 3.</strong> On my left as I leave the lift. I press the intercom at the door.</li>
<li><strong>Outside.</strong> Parramatta Square and Centenary Square have seats near trees and grass.</li>
<li><strong>Around PHIVE.</strong> There are quiet corners with natural light.</li>
</ul>
</div>
</div>
</div>
</section>

<section class="section" id="help">
<div class="wrap two">
<div>
<p class="label">Help in the building</p>
<h2>If I need more time or help</h2>
<p><strong>Hidden Disabilities Sunflower.</strong> PHIVE is Sunflower Friendly. Wearing a Sunflower shows that I may need more time or help. I do not need one to ask for help. Sunflower items are at Reception on the Ground Floor.</p>
<p><strong>Hearing.</strong> There is a free hearing app, opened with a QR code. I can also borrow a device from Customer Service on the Ground Floor.</p>
<p><strong>Who to ask.</strong> Any volunteer in a black shirt, or the welcome desk on Level 4.</p>
</div>
<div>
<p class="label">Access</p>
<h2>Getting around</h2>
<p><strong>Wheelchair access.</strong> PHIVE is wheelchair accessible. I can take the lift to Level 4.</p>
<p><strong>Adult changing facility.</strong> It has a hoist. It is on the Basement Mezzanine, one level below the Ground Floor. I use the intercom.</p>
<p><strong>Parents room.</strong> Level 1, on the left as I leave the lift. I use the intercom.</p>
<p><strong>Drop off.</strong> There is a drop off zone in front of the entrance doors, and accessible spaces in the car park.</p>
</div>
</div>
</section>

<section class="section tint vs-end">
<div class="wrap">
<p class="label">More about the day</p>
<h2>Times, people and consent</h2>
<p class="intro">The welcome pack has the full timetable, who is leading the day, parking and support numbers.</p>
<p class="vs-top"><a class="btn" href="/welcome">Open the welcome pack</a><a class="btn ghost" href="{COUNCIL}">City of Parramatta’s visual story for PHIVE (PDF)</a></p>
<p class="vs-src">Council’s visual story has more photos of the building, the library and the way in from the train, light rail, bus and car park.</p>
<p class="vs-src">The photos on this page are City of Parramatta’s. Details about the building come from City of Parramatta’s visual stories for <a href="{COUNCIL}">PHIVE</a> and <a href="https://www.cityofparramatta.nsw.gov.au/files/assets/public/v/1/publications/parramatta-library-visual-story-2025.pdf">Parramatta Library</a>, made with Autism Spectrum Australia (Aspect).</p>
</div>
</section>
'''
    page('visual-story.html', 'Visual story. Our Stories, Parramatta',
         'A visual story for Our Stories, Parramatta: what you will see and do at PHIVE on Saturday 28 November 2026, one step at a time.',
         body, current='visual')
