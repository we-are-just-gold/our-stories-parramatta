#!/usr/bin/env python3
"""Builds the static pages for the Our Stories, Parramatta site. Run: python3 build.py"""
import re
import os, html
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
REG = 'https://events.humanitix.com/our-stories-parramatta'
FUND = ('Our Stories, Parramatta is an initiative of SydWest and the City of Parramatta, funded by the '
        'NSW Government through the NSW Social Cohesion Grants for Local Government program.')
ACK = ('Our Stories, Parramatta takes place on the land of the Burramattagal people of the Dharug Nation, '
       'the first storytellers of the place we now call Parramatta. We pay our respects to Elders past and present.')
RING = ('<svg class="ring" aria-hidden="true" viewBox="0 0 600 600"><circle cx="300" cy="300" r="270" '
        'fill="none" stroke="#CDB1AF" stroke-width="34"/></svg>')
e = html.escape



ARROW = '<svg class="go" aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'
TICK = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'

def actions():
    def act(n, cls, key, href, when, title, sub):
        return (f'<a class="act {cls}" href="{href}" data-key="{key}">'
                f'<span class="num" aria-hidden="true">{n}</span>'
                f'<span class="txt"><span class="when">{when}</span><span class="ttl">{title}</span><span class="sub">{sub}</span>'
                f'<span class="done" hidden>{TICK} Done. Tap to do it again</span></span>{ARROW}</a>')
    return ('<nav class="acts" aria-label="What to do today">'
            + act(1, 'a1', 'arrival-survey', '/arrival-survey', 'When you arrive', 'Start your day', 'Arrival survey. 10 short questions.')
            + act(2, 'a2', 'through-the-day', '/during', 'Any time today', 'Add your voice', 'Tell us what you heard or thought. No name.')
            + act(3, 'a3', 'end-of-day-survey', '/end-of-day-survey', 'Before you leave', 'End your day', 'End of day survey. About five minutes.')
            + '</nav>')

def tabs(current):
    def tab(key, href, label, time):
        cur = ' aria-current="page"' if key == current else ''
        return f'<a href="{href}"{cur} data-session="{key}"><span class="tl">{label}</span><span class="tt">{time}</span></a>'
    return ('<nav class="tabs" aria-label="Sessions">'
            + tab('hear', '/hear', 'Hear', '10am') + tab('lunch', '/lunch', 'Lunch', '12pm')
            + tab('create', '/create', 'Create', '12.45pm') + tab('share', '/share', 'Share', '3pm') + '</nav>')

def tiles():
    def tile(cls, key, href, name, time, line):
        return (f'<a class="tile {cls}" href="{href}" data-session="{key}"><span class="now" hidden></span>'
                f'<span class="time">{time}</span><span class="name">{name}</span><span class="line">{line}</span>{ARROW}</a>')
    return ('<nav class="tiles" aria-label="The three sessions">'
            + tile('t1', 'hear', '/hear', 'Hear', '10am to 12pm', 'Local voices on what it takes to belong in Parramatta.')
            + tile('t2', 'create', '/create', 'Create', '12.45pm to 2.45pm', 'Shape your own story with Our Race.')
            + tile('t3', 'share', '/share', 'Share', '3pm to 5pm', 'Tell it in a small circle, or simply listen.')
            + '</nav>'
            + '<a class="lunchbar" href="/lunch" data-session="lunch"><span class="lt">12pm</span>'
              '<span class="ln">Lunch, from Racha’s Syrian Kitchen</span>' + ARROW + '</a>')


VOL_HASH = 'a3c4480df0d51a006ce17f5712259ec5b05bee492919163137b0d015222607fb'
HOST_HASH = '9792875ded1497999a4de46722835339cce9346191da1c1ebc4ec5c144d9d407'
def guard_script(role):
    ok = [HOST_HASH] if role == 'host' else [HOST_HASH, VOL_HASH]
    test = '&&'.join("v!=='" + h + "'" for h in ok)
    return ("<script>try{var v=localStorage.getItem('os_team');if(" + test + ")"
            "location.replace('/hosts?next='+location.pathname.replace(/\\.html$/,''))}catch(e){}</script>")

def page(path, title, desc, body, current='', noindex=False, script=False, guard=''):
    def nav(href, text, key):
        cur = ' aria-current="page"' if key == current else ''
        return f'<a href="{href}"{cur}>{text}</a>'
    robots = '<meta name="robots" content="noindex">' if noindex else ''
    js = '<script src="/js/site.js" defer></script>'
    teambtns = ''
    if path == 'index.html' or current in ('hosts', 'volunteers'):
        teambtns = ('<span class="teambtns"><a class="teambtn" href="/hosts"'
                    + (' aria-current="page"' if current == 'hosts' else '') + '>Hosts</a><a class="teambtn" href="/volunteers"'
                    + (' aria-current="page"' if current == 'volunteers' else '') + '>Volunteers</a><a class="teambtn" href="/desk"'
                    + (' aria-current="page"' if current == 'desk' else '') + '>Desk</a></span>')
    if guard:
        js = guard_script(guard) + '\n' + js
    out = f'''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{robots}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/host-grotesk-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
{js}
</head>
<body>
<a class="skip" href="#main">Skip to the main content</a>
<header class="site-head{' is-slim' if current == 'desk' else ''}">
<div class="wrap">
<a class="brand" href="/" aria-label="Our Stories, Parramatta home"><img src="/img/our-stories.png" alt="Our Stories, Parramatta" width="196" height="92"></a>
<nav class="nav" aria-label="More">
{nav('/welcome', 'Welcome pack', 'welcome')}
{nav('/consent', 'Consent form', 'consent')}
{nav('/privacy', 'Privacy', 'privacy')}
</nav>
{teambtns}
</div>
</header>
{'' if current == 'desk' else tabs(current)}
<main id="main">
{body}
</main>
<footer class="site-foot">
<div class="wrap top">
<div class="logos">
<img src="/img/partners.png" alt="Our Stories Parramatta, SydWest, City of Parramatta and NSW Government" width="860" height="108">
<p>{FUND}</p>
</div>
<nav aria-label="Footer">
<div><b>TODAY</b>
<a href="/hear">Hear, 10am</a>
<a href="/lunch">Lunch, 12pm</a>
<a href="/create">Create, 12.45pm</a>
<a href="/share">Share, 3pm</a>
<a href="/arrival-survey">Start your day</a>
<a href="/during">Add your voice</a>
<a href="/share-your-story">Share your story</a>
<a href="/end-of-day-survey">End your day</a></div>
<div><b>LOOKING AFTER YOU</b>
<a href="/welcome">Welcome pack</a>
<a href="/consent">Consent form</a>
<a href="/#support">Support numbers</a>
<a href="/hosts">For hosts</a>
<a href="/volunteers">For volunteers</a>
<a href="/desk">Welcome desk</a>
<a href="/privacy">Privacy notice</a>
<a href="https://sydwestms.org.au/privacy-policy/">SydWest privacy policy</a></div>
</nav>
</div>
<div class="base"><div class="wrap">
<p>{ACK}</p>
<div class="credit">
<p>Design and copyright © Just Gold 2026</p>
<div class="by">
<p class="by-t">Powered by <span class="thinkr">Thinkr</span></p>
<a class="by-l" href="https://justgold.net"><img src="/img/just-gold-white.png" alt="Just Gold" width="497" height="228" loading="lazy"></a>
</div>
</div>
</div></div>
</footer>
</body>
</html>
'''
    with open(os.path.join(ROOT, path), 'w') as f:
        f.write(out)



RESEARCH = ('By taking part today you are taking part in the research. What is said in the room, in the surveys and on this '
            'site is captured without names and becomes themes in a report for SydWest, the City of Parramatta and the NSW '
            'Government. Once the report is published, what you contributed cannot be taken out of it.')
HOLD = ('Just Gold holds what you send here on behalf of SydWest. It keeps the record for one month after the day, '
        'then hands it to SydWest and deletes its own copy. <a href="/privacy">Read the privacy notice</a>.')
PRINT = '<p class="printlink"><button type="button" class="btn ghost small" onclick="window.print()">Print a paper copy</button></p>'

CARE = ('Leave out names and personal details, yours and other people’s. Share only what you are comfortable sharing. '
        'If something brings things up, the <a href="/#support">support numbers</a> are here.')

# ---------- form helpers ----------
_id = [0]
def uid():
    _id[0] += 1
    return f'f{_id[0]}'

def opts(name, options, kind='radio', required=False, cols=False, cls='opts'):
    h = [f'<div class="{cls}{" cols" if cols else ""}">']
    for i, o in enumerate(options):
        i_d = uid()
        req = ' required' if (required and kind == 'radio') else ''
        h.append(f'<div class="opt"><input type="{kind}" id="{i_d}" name="{name}" value="{e(o)}"{req}>'
                 f'<label for="{i_d}">{e(o)}</label></div>')
    h.append('</div>')
    return '\n'.join(h)

def q(n, legend, inner, hint=''):
    hint = f'<p class="hint">{hint}</p>' if hint else ''
    num = f'<span class="n">{n}.</span> ' if n else ''
    return f'<fieldset>\n<legend>{num}{legend}</legend>\n{hint}\n{inner}\n</fieldset>'

AGREE = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree', 'Don’t know/ not sure']
COMFORT = ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable', 'I do not want to share']
AGES = ['15 years or less', '16 to 18 years', '19 to 29 years', '30 to 39 years', '40 to 49 years',
        '50 to 59 years', '60 to 69 years', '70 years or older', 'I’d prefer not to say']

def stmts(items):
    h = []
    for name, text in items:
        g = uid()
        h.append(f'<div class="stmt" role="group" aria-labelledby="{g}"><p class="s" id="{g}">{e(text)}</p>\n'
                 + opts(name, AGREE, cls='scale') + '</div>')
    return '\n'.join(h)

def picks(items):
    h = []
    for name, text, options in items:
        g = uid()
        h.append(f'<div class="stmt" role="group" aria-labelledby="{g}"><p class="s" id="{g}">{e(text)}</p>\n'
                 + opts(name, options, cols=True) + '</div>')
    return '\n'.join(h)

def self_check(items, options):
    h = []
    for i, text_ in enumerate(items):
        g = uid()
        h.append(f'<div class="stmt" role="group" aria-labelledby="{g}"><p class="s" id="{g}">{e(text_)}</p>\n'
                 + opts(f'check_{i + 1}', options, cols=True) + '</div>')
    return '<div class="selfcheck">' + '\n'.join(h) + '</div>'

def text(name, label, kind='text', required=False, cls='', extra=''):
    i_d = uid()
    req = ' required' if required else ''
    c = f' class="{cls}"' if cls else ''
    return (f'<div class="field"><label for="{i_d}">{label}</label>'
            f'<input type="{kind}" id="{i_d}" name="{name}"{c}{req}{extra}></div>')

def area(name, label):
    i_d = uid()
    return f'<div class="field"><label class="vh" for="{i_d}">{label}</label><textarea id="{i_d}" name="{name}"></textarea></div>'

def form(name, inner, button, multipart=False):
    enc = ' enctype="multipart/form-data"' if multipart else ''
    return f'''<form name="{name}" method="POST" action="/thanks"{enc} data-netlify="true" netlify-honeypot="bot-field" data-form>
<input type="hidden" name="form-name" value="{name}">
<p class="bot"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
{inner}
<div class="submit"><button class="btn" type="submit">{button}</button></div>
</form>'''

SUPPORT_SURVEY = '''<p>If you feel upset and need more support, you can call:</p>
<ul>
<li><b>Lifeline</b> 13 11 14</li>
<li><b>Beyond Blue Support Service</b> 1300 22 4636</li>
<li><b>Kids Helpline</b> 1800 55 1800, for people aged 5 to 25</li>
<li><b>13YARN</b> 13 92 76, for Aboriginal and Torres Strait Islander services</li>
</ul>'''

def survey_note(when):
    return f'''<div class="note">
<p>The NSW Premier’s Department is evaluating the NSW Social Cohesion Grants for Local Government program, which funds Our Stories, Parramatta. SydWest and the City of Parramatta also use this survey to understand {when}.</p>
<p>It is voluntary and anonymous. In reporting, your responses will not be identifiable in any way. You can skip any question and still take part in the day.</p>
<p>Questions about the survey go to Kyriakos Gold at Just Gold, <a href="mailto:kyriakos@justgold.net">kyriakos@justgold.net</a>. The survey is not monitored for urgent help. On the day, speak to any volunteer and they will find the event lead.</p>
{SUPPORT_SURVEY}
<p>{HOLD}</p>
<p>By continuing with the survey you are providing consent to participate in this research.</p>
</div>'''

SCREEN_OUT = ('<div class="stop" data-screen-out hidden><p>Thanks for participating in this survey. '
              'Unfortunately, we can only hear from participants 16 years or over in this survey.</p></div>')

def about_you():
    g = opts('gender', ['Woman', 'Man', 'I identify my gender as: (please specify)', 'I’d prefer not to say'])
    g += ('<div data-reveal="gender=I identify my gender as: (please specify)" hidden>'
          + text('gender_specified', 'I identify my gender as') + '</div>')
    return '\n'.join([
        q(2, 'What is your gender?', g),
        q(3, 'Are you of Aboriginal or Torres Strait Islander origin?',
          opts('aboriginal_or_torres_strait_islander_origin',
               ['No', 'Yes, Aboriginal', 'Yes, Torres Strait Islander',
                'Yes, Aboriginal and Torres Strait Islander', 'I’d prefer not to say'])),
        q(4, 'What is your country of birth?',
          opts('country_of_birth', ['I was born in Australia', 'I was born overseas', 'I’d prefer not to say'])),
        q(5, 'Were your parents born in Australia?',
          opts('parents_born_in_australia',
               ['Yes, my parents were born in Australia',
                'No, one or both of my parents were born overseas', 'I’d prefer not to say'])),
        q(6, 'Do you use a language other than English at home?',
          opts('language_other_than_english_at_home',
               ['No, English only', 'Yes, another language', 'I’d prefer not to say'])),
        q(7, 'What is your postcode?',
          text('postcode', 'Postcode, four digits', cls='short',
               extra=' inputmode="numeric" pattern="[0-9]{4}" autocomplete="postal-code"'),
          'Optional.'),
    ])


# ---------- home ----------
home = f'''
<section class="hwelcome" aria-label="Welcome">
<div class="wrap">
<div class="wtext">
<p class="wscript">Welcome.</p>
<h2>Scan the code to open the app on your phone</h2>
<ol class="wsteps">
<li>Point your phone camera at the code.</li>
<li>Tap <b>Start your day</b>.</li>
</ol>
<p class="wurl">ourstoriesparramatta.netlify.app</p>
</div>
<img src="/img/qr-home.svg" alt="QR code that opens this app" class="wqr" width="330" height="330">
</div>
</section>
<section class="start" id="top">
<div class="wrap">
<p class="eyebrow">Our Stories, Parramatta. Saturday 28 November 2026</p>
<h1 class="h-start">Three things to do today</h1>
{actions()}
<div class="also two-btn"><a class="btn" href="/consent">Consent form. Photos, filming and your story</a><a class="btn ghost" href="/share-your-story">Share your story, with or without your name</a></div>
<h2 class="h-sub">The three sessions</h2>
{tiles()}
<div class="teamrow">
<p><b>Running the day?</b> Hosts, volunteers and the welcome desk each have their own page and their own password.</p>
<div><a class="btn ghost small" href="/hosts">Hosts and facilitators</a><a class="btn ghost small" href="/volunteers">Volunteers</a><a class="btn ghost small" href="/desk">Welcome desk</a></div>
</div>
</div>
</section>

<section class="section tint">
<div class="wrap two">
<div>
<p class="label">Welcome pack</p>
<h2>Everything about the day</h2>
<p>The times, the people, how to get to PHIVE, where the quiet space and prayer room are, and how we look after you.</p>
<p><a class="btn small" href="/welcome">Open the welcome pack</a></p>
</div>
<div>
<p class="label">Consent form</p>
<h2>Photos, filming and your story</h2>
<p>We are taking photos and video today. Tell us how you want to be treated. One minute.</p>
<p><a class="btn small" href="/consent">Open the consent form</a></p>
</div>
</div>
</section>

<section class="section" id="support">
<div class="wrap">
<p class="label">Looking after people</p>
<h2>If a story brings things up</h2>
<p class="intro">That is normal. You can step out of any session whenever you need to, and you can talk to someone.</p>
<ul class="support">
<li><b>Lifeline</b>13 11 14. Crisis support, 24 hours.</li>
<li><b>13YARN</b>13 92 76. Aboriginal and Torres Strait Islander crisis support, 24 hours.</li>
<li><b>Beyond Blue Support Service</b>1300 22 4636.</li>
<li><b>Kids Helpline</b>1800 55 1800. Young people aged 5 to 25, 24 hours.</li>
<li><b>Transcultural Mental Health Centre</b>1800 648 911. Support in your language. Monday to Friday, 9am to 4.30pm.</li>
</ul>
</div>
</section>
'''
page('index.html', 'Our Stories, Parramatta. Saturday 28 November 2026',
     'Our Stories, Parramatta: the arrival survey, your voice during the sessions and the end of day survey.',
     home)


def hero(label, h1, script, lead, cls='', extra=''):
    return f'''<section class="page-hero{cls}">
{RING}
<div class="narrow">
<p class="label">{label}</p>
<h1>{h1}</h1>
<p class="script">{script}</p>
<p class="lead">{lead}</p>{extra}
</div>
</section>'''


# ---------- arrival survey ----------
arrival_inner = '\n'.join([
    q(1, 'What is your age?', opts('age', AGES, required=True, cols=True)),
    SCREEN_OUT,
    '<div data-after-age>',
    about_you(),
    q(8, 'To what extent do you agree with the following statements?', stmts([
        ('i_feel_connected_to_my_community', 'I feel connected to my community'),
        ('i_feel_like_i_belong_in_my_community', 'I feel like I belong in my community'),
        ('i_engage_regularly_with_people_with_different_experiences_and_worldview',
         'I engage regularly with people with different experiences and worldview'),
        ('i_believe_i_can_make_a_valuable_contribution',
         'I believe I can make a valuable contribution to community activities and initiatives'),
    ])),
    q(9, 'How comfortable do you feel about sharing a story of your own?', opts('comfort_sharing_a_story', COMFORT, cols=True)),
    q(10, 'What do you hope to gain from the day?', area('hope_to_gain', 'What do you hope to gain from the day?'), 'Optional.'),
    '</div>',
])
arrival = hero('Start your day', 'Before your', 'first session.',
               'A few questions about you and your community. Fill it in when you arrive.') + f'''
<section class="form"><div class="narrow">
{survey_note('who came and how people feel about their community')}
{form('arrival-survey', arrival_inner, 'Send my answers')}
{PRINT}
</div></section>'''
page('arrival-survey.html', 'Arrival survey. Our Stories, Parramatta',
     'The arrival survey for Our Stories, Parramatta.', arrival, current='arrival', noindex=True, script=True)


# ---------- end of day survey ----------
def sentence(pairs):
    h = ['<div class="sentence">']
    for name, label in pairs:
        i_d = uid()
        h.append(f'<label for="{i_d}">{label}</label><input type="text" id="{i_d}" name="{name}">')
    h.append('</div>')
    return '\n'.join(h)

end_inner = '\n'.join([
    q(1, 'What is your age?', opts('age', AGES, required=True, cols=True)),
    SCREEN_OUT,
    '<div data-after-age>',
    q(2, 'Which sessions did you attend?', opts('sessions_attended[]', ['Hear', 'Create', 'Share'], kind='checkbox', cols=True),
      'Choose all that apply.'),
    q(3, 'Finish the sentence', sentence([('before_today_i_thought', 'Before today I thought'), ('now_i', 'Now I')]), 'Optional.'),
    q(4, 'Finish the sentence', sentence([('a_story_that_stayed_with_me_was', 'A story that stayed with me was'),
                                          ('because', 'because')]), 'Optional.'),
    q(5, 'To what extent do you agree with the following statements?', stmts([
        ('could_discuss_issues_without_being_judged',
         'During Our Stories I could discuss issues that mattered to me without being judged'),
        ('learnt_about_different_perspectives', 'I have learnt about different perspectives as a result of Our Stories'),
        ('learnt_about_different_ways_of_life', 'I have learnt about different ways of life as a result of Our Stories'),
        ('met_new_people', 'I met new people during Our Stories'),
        ('hope_to_be_in_contact_in_12_months',
         'I hope I will still be in contact with some of these people in 12 months’ time'),
        ('new_connection_from_a_different_cultural_background',
         'I made a new connection with someone from a different cultural background'),
    ])),
    q(6, 'How comfortable do you feel about sharing a story of your own?', opts('comfort_sharing_a_story', COMFORT, cols=True)),
    q(7, 'Since taking part in Our Stories, to what extent do you agree with the following statements?', stmts([
        ('feel_more_connected_to_my_community', 'I feel more connected to my community'),
        ('greater_sense_of_belonging', 'I feel a greater sense of belonging in my community'),
        ('engage_more_regularly_with_different_people',
         'I engage more regularly with people with different experiences and worldview'),
        ('now_believe_i_can_make_a_valuable_contribution',
         'I now believe I can make a valuable contribution to community activities and initiatives'),
    ])),
    q(8, 'Is there anything else you would like to add?', area('anything_else', 'Is there anything else you would like to add?'), 'Optional.'),
    '</div>',
])
endp = hero('End your day', 'What will you', 'carry home?',
            'About five minutes on what you heard, who you met and how the day was for you.') + f'''
<section class="form"><div class="narrow">
{survey_note('what the day was like for the people who came')}
{form('end-of-day-survey', end_inner, 'Send my answers')}
{PRINT}
</div></section>'''
page('end-of-day-survey.html', 'End of day survey. Our Stories, Parramatta',
     'The end of day survey for Our Stories, Parramatta.', endp, current='end', noindex=True, script=True)


# ---------- consent form ----------
guardian = ('<div data-reveal="under_18=Yes, and I am their parent or guardian" hidden>'
            + q('', 'Parent or guardian only: the young person',
                text('young_person_name', 'Their name', extra=' data-req')
                + text('guardian_name', 'Your name', extra=' data-req')
                + text('guardian_mobile', 'Your mobile', kind='tel', extra=' autocomplete="tel" data-req')
                + '<div class="opts" style="margin-top:20px"><div class="opt"><input type="checkbox" id="perm" '
                  'name="guardian_permission_to_take_part" value="Yes" data-req><label for="perm">I give permission for '
                  'them to take part in Our Stories, Parramatta on Saturday 28 November 2026.</label></div></div>')
            + q('', 'Parent or guardian only: photos, video and recordings of them',
                opts('young_person_photos_and_video',
                     ['These can be published.', 'These cannot be published. Please give them a bright sticker.']))
            + '</div>')
consent_inner = '\n'.join([
    q(1, 'Your name, as on your booking', text('name', 'Full name', required=True, extra=' autocomplete="name"')),
    q(2, 'Photos and video of the day',
      opts('photos_and_video', ['I am happy to be in photos and video.',
                                'I would rather not be photographed or filmed. Please have a bright sticker ready for me.'],
           required=True),
      'We are taking photos and video. They may be used online, in promotion and in the report. Nobody is named unless they choose to be.'),
    q(3, 'Is anyone on your booking under 18?',
      opts('under_18', ['No', 'Yes, and I am their parent or guardian', 'Yes, I am under 18 myself'], required=True)),
    '<div class="stop" data-minor-stop hidden><p>Please ask your parent or guardian to fill this in for you. Nobody under 18 '
    'takes part in any session until a parent or guardian has filled this in.</p></div>',
    guardian,
    '<div data-sign>' + q(4, 'Sign', text('signature', 'Type your full name as your signature', required=True),
                          'The form records the date and time.') + '</div>',
])
consent = hero('Consent form', 'Photos, filming and', 'your story.',
               'One minute. It tells us how you want to be treated on the day.') + f'''
<section class="form"><div class="narrow">
<div class="note">
<p>Our Stories, Parramatta is funded by the NSW Government to learn what belonging looks like for the people who live, work, study or visit Parramatta.</p>
<p>{RESEARCH}</p>
<p>This form is about photos, video and recordings. Saying no changes nothing about how you take part, and you can change your choice on the day by telling a volunteer at the welcome desk.</p>
</div>
{form('consent', consent_inner, 'Send my consent form')}
<div class="note" style="margin-top:48px">
<p>SydWest and Just Gold will not use photos, video or recordings after five years. The NSW Premier’s Department, which funds the day, may also use them.</p>
<p>Nobody is named unless they choose to be.</p>
<p>{HOLD} <a href="https://sydwestms.org.au/privacy-policy/">SydWest privacy policy</a>. We follow the <a href="https://www.ourrace.com.au/story-support">T.E.S.T. principles</a> from Our Race.</p>
</div>
{PRINT}
</div></section>'''
page('consent.html', 'Consent form. Our Stories, Parramatta',
     'The consent form for Our Stories, Parramatta.', consent, current='consent', noindex=True, script=True)



# ---------- during the day ----------
def big_area(name, label, rows=6):
    i_d = uid()
    return f'<div class="field"><label for="{i_d}">{label}</label><textarea id="{i_d}" name="{name}" rows="{rows}"></textarea></div>'

during_inner = '\n'.join([
    q(1, 'What do you want to tell us?',
      big_area('insight', 'Your insight, reflection or message', rows=7),
      'Something you heard, something it made you think, or what the people who run this city should understand from today.'),
    q(2, 'Which session are you in?', opts('session', ['Hear', 'Lunch', 'Create', 'Share', 'After the day'], cols=True), 'Optional.'),
])
duringp = hero('Through the day', 'Add your', 'voice.',
               'Use this at any point, as many times as you like. No name needed.') + f'''
<section class="form"><div class="narrow">
<div class="note"><p>{RESEARCH}</p><p>{CARE}</p><p>{HOLD}</p></div>
{form('through-the-day', during_inner, 'Send')}
<div class="note" style="margin-top:48px">
<p><strong>Want to tell your story in full?</strong> You can, with or without your name.</p>
<p><a class="btn small" href="/share-your-story">Share your story</a></p>
</div>
</div></section>'''
page('during.html', 'Through the day. Our Stories, Parramatta',
     'Add your voice during Our Stories, Parramatta.', duringp, current='during', noindex=True, script=True)

def pics(pid, first_label='Choose photos, or take one now'):
    return ('<div data-pics>'
            f'<div class="field"><label for="{pid}" data-first="{first_label}">{first_label}</label>'
            f'<input type="file" id="{pid}" name="picture" accept="image/*"></div>'
            + ''.join(f'<div class="field" data-extra><label for="{pid}{i}">Picture {i}</label>'
                      f'<input type="file" id="{pid}{i}" name="picture_{i}" accept="image/*"></div>' for i in range(2, 6))
            + '</div><ul class="pics" data-piclist hidden></ul><p class="filemsg" data-filemsg hidden></p>')

story_inner = '\n'.join([
    q(1, 'Your story', big_area('story', 'Tell it your way', rows=10),
      'It does not need to be finished or tidy. You decide what you tell, and what you keep. You can use your mother tongue.'),
    q(2, 'Add pictures',
      pics('pic'),
      'Optional. Up to five. Photos of you, of your work, of something that carries your story, or of the pages if you wrote it by hand. '
      'A picture can show who you are even without your name, so only send ones you are happy for us to use, and ask anyone else in them first.'),
    q(3, 'With your name, or without it?',
      opts('name_me_as', ['Without my name', 'With my first name only', 'With my full name'], required=True)),
    '<div data-reveal="name_me_as=With my first name only|With my full name">'
    + q(4, 'Your name', text('name', 'Your name, as you want it to appear', extra=' autocomplete="name" data-req')
        + text('contact', 'Email or phone, so we can reach you about your story', extra=' data-req'))
    + q(5, 'A portrait',
        opts('portrait', ['Yes, I would like the photographer to take my portrait today.', 'No portrait.']))
    + '</div>',
    q(6, 'Are you 18 or over?', opts('adult', ['Yes', 'No, I am under 18'], required=True, cols=True)),
    '<div class="stop" data-reveal="adult=No, I am under 18"><p>Please ask your parent or guardian to send this with you. '
    'We use a story from someone under 18 only with their parent or guardian’s consent.</p></div>',
    q(7, 'Your yes',
      '<div class="opts"><div class="opt"><input type="checkbox" id="yes" name="story_consent" value="Yes" required>'
      '<label for="yes">I am happy for my story, and any pictures I sent, to be used in the report, the way I chose above.</label></div></div>',
      'The form records the date and time.'),
])
storyp = hero('Share your story', 'What does belonging look like', 'for you?',
              'Only if you want to. Tell it in full, with your name or without it.') + f'''
<section class="form"><div class="narrow">
<div class="note"><p>Stories sent without a name are used in the report without one. If you choose to be named, your story can appear in the report as a case study, named the way you chose.</p><p>{HOLD}</p></div>
{form('share-your-story', story_inner, 'Send my story', multipart=True)}
</div></section>'''
page('share-your-story.html', 'Share your story. Our Stories, Parramatta',
     'Share your story with Our Stories, Parramatta.', storyp, current='during', noindex=True, script=True)

# ---------- welcome pack ----------
def row(time, what, where=''):
    w = f'<span class="where">{where}</span>' if where else ''
    return f'<li><b class="t">{time}</b><span class="w">{what}{w}</span></li>'

SUPPORT_FULL = '''<ul class="support">
<li><b>Lifeline</b>13 11 14. Crisis support, 24 hours. For an interpreter call 13 14 50 first.</li>
<li><b>13YARN</b>13 92 76. Aboriginal and Torres Strait Islander crisis support, 24 hours.</li>
<li><b>Transcultural Mental Health Centre</b>1800 648 911. Support in your language. Monday to Friday, 9am to 4.30pm.</li>
<li><b>STARTTS</b>02 9646 6700. Survivors of torture and refugee trauma, and their families.</li>
<li><b>QLife</b>1800 184 527. LGBTIQ+ peer support.</li>
<li><b>Kids Helpline</b>1800 55 1800. Young people aged 5 to 25, 24 hours.</li>
</ul>'''

welcomep = hero('Welcome pack', 'Welcome to', 'Our Stories.',
                'Everything you need for Saturday 28 November 2026 at PHIVE, Parramatta.',
                extra='\n<p class="printlink"><a class="btn small" href="/Our_Stories_Welcome_Pack.pdf" download>Download the welcome pack (PDF)</a></p>') + f'''
<section class="section" id="day">
<div class="wrap">
<p class="label">The day at a glance</p>
<h2>One day, three sessions</h2>
<p class="intro">Come to one session, two or all three. Coming just to listen is taking part. Nobody is asked to share anything they do not want to, and you can use your mother tongue.</p>
<ol class="glance">
{row('9.30am', 'Doors open. Sign in, pick up your name badge and fill in the <a href="/arrival-survey">arrival survey</a>.', 'Welcome desk, Level 4')}
{row('10am to 12pm', '<strong>Hear.</strong> Welcome to Country at 10.05am, conversation, performance and the room’s first poll.', 'Civic Gallery, Level 4')}
{row('12pm to 12.45pm', '<strong>Lunch</strong> for everyone attending any session. Cultural dance, and a conversation between a flautist and an electric guitarist.', 'Civic Gallery foyer')}
{row('12.45pm to 2.45pm', '<strong>Create.</strong> A storytelling workshop for adults, and a writing and performance session for ages 15 to 25.', 'Adults: Civic Gallery')}
{row('3pm to 5pm', '<strong>Share.</strong> Small sharing circles, stage spots for people who opt in, the <a href="/end-of-day-survey">end of day survey</a> and wrap up.', 'Civic Gallery, Level 4')}
</ol>
</div>
</section>

<section class="section tint" id="people">
<div class="wrap">
<p class="label">Who is who</p>
<h2>The people leading the day</h2>
<div class="people" style="margin-top:44px">
<article><img src="/img/rumbi.jpg" alt="Dr Rumbi Mabambe" width="160" height="160">
<h3>Dr Rumbi Mabambe (Dr Ru)</h3><p class="role">Facilitator for the day</p>
<p>A facilitator, researcher and CEO of Chain Reaction Foundation.</p></article>
<article><img src="/img/doug.jpg" alt="Doug Cronin" width="160" height="160">
<h3>Doug Cronin</h3><p class="role"><a href="https://www.ourrace.com.au/">Our Race</a>. Facilitator, Create</p>
<p>Co-Founder and Director of Our Race, and a co-creator of the Transformational Ethical Story Telling (T.E.S.T.) Framework.</p></article>
<article><img src="/img/hawanatu.jpg" alt="Hawanatu Bangura" width="160" height="160">
<h3>Hawanatu Bangura</h3><p class="role"><a href="https://www.ourrace.com.au/">Our Race</a>. Facilitator, Create</p>
<p>A Sierra Leonean-Australian filmmaker, social worker and story coach, and the creator of the Defining Moments Cards.</p></article>
<article><img src="/img/defne.jpg" alt="DEFNE" width="160" height="160">
<h3>DEFNE</h3><p class="role">Performer, Hear</p>
<p>A queer neurodivergent Turkish-Australian multidisciplinary artist and the Creative Director and Host of West Side Poetry Slam in Parramatta. Photo: Justin Cueno</p></article>
</div>
</div>
</section>

<section class="section" id="venue">
<div class="wrap two">
<div>
<p class="label">The venue</p>
<h2>PHIVE</h2>
<p>5 Parramatta Square, Parramatta NSW 2150. PHIVE is the building with the City of Parramatta Library, next to Parramatta Town Hall.</p>
<p><strong>Train.</strong> PHIVE is two minutes on foot from Parramatta station. Leave the station onto Parramatta Square and PHIVE is on your right.</p>
<p><strong>Inside.</strong> Use the main entrance on the ground level and take the lift or stairs to Level 4 for the Civic Gallery. PHIVE is wheelchair accessible.</p>
<p><strong>Wi-Fi.</strong> Free public Wi-Fi runs through PHIVE. The network is called PARRAMATTA, Where it’s AT.</p>
</div>
<div>
<p class="label">Open all day</p>
<h2>Spaces for you</h2>
<p><strong>Quiet space, Level 4.</strong> In the foyer. Step out of any session whenever you need to, and come back when you are ready.</p>
<p><strong>Prayer room, Level 3.</strong> On your left as you leave the lift. Press the intercom at the door.</p>
<p><strong>Lunch.</strong> At 12pm for everyone attending any session, by <a href="https://www.rachasyriankitchen.com.au">Racha’s Syrian Kitchen</a>. All food is halal, with gluten free, vegetarian and vegan options.</p>
<p class="flag">If you have a nut allergy or any other allergy, tell us at the welcome desk.</p>
<p><strong>Parking.</strong> O’Connell Street Car Park, 21 O’Connell Street, is free on weekends and 14 minutes on foot. Westfield Parramatta gives Westfield members four hours free and is 5 minutes on foot. Parramatta Station Car Park, Wentworth Street, and Justice Precinct Car Park, 13 Hunter Street, are $14 for 3 to 18 hours and 7 minutes on foot.</p>
</div>
</div>
</section>

<section class="section tint" id="consent">
<div class="wrap two">
<div>
<p class="label">Photos, filming and consent</p>
<h2>Your image, your choice</h2>
<p>We are taking photos and video. Saying no is easy, and it changes nothing about how you take part.</p>
<ul class="list">
<li>A bright sticker means: do not photograph or film me, wide shots included. Ask for one at the welcome desk.</li>
<li>Camera free tables stay out of frame.</li>
<li>A stage spot in Share is photographed and filmed, and only happens if you choose one.</li>
<li>Bringing someone under 18? Tell us before Saturday. A parent or guardian fills in the consent form for them before they join any session.</li>
<li>Nobody is named unless they choose to be.</li>
<li>Changed your mind? Tell any volunteer. If you ask for a photo or clip of you to be deleted, it is deleted.</li>
<li>Your own phone: ask before you photograph or record anyone’s story.</li>
</ul>
<p><a class="btn" href="/consent">Open the consent form</a></p>
</div>
<div>
<p class="label">What happens to what we hear</p>
<h2>How we use what we share</h2>
<p>{RESEARCH}</p>
<p>The arrival and end of day surveys feed the report that goes back to everyone who took part.</p>
<p>Want to tell your story in full? <a href="/share-your-story">Share your story</a>, with or without your name.</p>
<p>We follow the <a href="https://www.ourrace.com.au/story-support">Transformational Ethical Story Telling (T.E.S.T.) principles</a> from Our Race.</p>
</div>
</div>
</section>

<section class="section" id="support">
<div class="wrap">
<p class="label">Looking after people</p>
<h2>Some stories bring things up</h2>
<p class="intro">That is normal. Step out to the quiet space whenever you need to. A counsellor is on site from about 11am, and there is a support card on every table. In an emergency call triple zero (000).</p>
{SUPPORT_FULL}
</div>
</section>
'''
page('welcome.html', 'Welcome pack. Our Stories, Parramatta',
     'The welcome pack for people coming to Our Stories, Parramatta on Saturday 28 November 2026.', welcomep, current='welcome')




# ---------- people ----------
def person(img, alt, name, role, bio, link='', linktext=''):
    l = f' <a href="{link}">{linktext}</a>' if link else ''
    return (f'<article class="fp"><img src="/img/{img}" alt="{alt}" width="120" height="120">'
            f'<div><h3>{name}</h3><p class="role">{role}</p><p>{bio}{l}</p></div></article>')

RU = person('rumbi.jpg', 'Dr Rumbi Mabambe', 'Dr Rumbi Mabambe (Dr Ru)', 'Your facilitator for the day',
            'A facilitator, researcher and CEO of Chain Reaction Foundation. She brings warmth and curiosity to conversations '
            'about what helps people feel heard, connected and at home in their communities.')
DEFNE = person('defne.jpg', 'DEFNE', 'DEFNE', 'Performing in Hear',
               'A queer neurodivergent Turkish-Australian multidisciplinary artist and the Creative Director and Host of '
               'West Side Poetry Slam in Parramatta. Photo: Justin Cueno')
DOUG = person('doug.jpg', 'Doug Cronin', 'Doug Cronin', 'Our Race. Co-Founder and Director',
              'An ethical storytelling learner, educator and advocate. More than 10 years of learning about the power of '
              'storytelling led Doug to co-create the Transformational Ethical Story Telling Framework and to work on '
              'storytelling projects across Australia and abroad.')
HAWA = person('hawanatu.jpg', 'Hawanatu Bangura', 'Hawanatu Bangura', 'Our Race. Filmmaker, social worker and story coach',
              'A Sierra Leonean-Australian filmmaker, social worker and story coach whose work sits at the intersection of '
              'healing, identity and community. She is the creator of the Defining Moments Cards.')

FAC = {
 'hear': '<section class="fac"><div class="narrow"><p class="label">With you in Hear</p>' + RU + DEFNE + '</div></section>',
 'create': ('<section class="fac"><div class="narrow">'
            '<img class="orlogo" src="/img/our-race.png" alt="Our Race. Flipping the power together" width="371" height="482">'
            '<p class="label">Create is led by Our Race</p>'
            '<p class="about">Our Race Community is an anti-racism storytelling charity that champions authentic narrative '
            'representation. It partners directly with individuals and communities affected by racial and social injustices, '
            'amplifying voices that have historically been marginalised. At the heart of its approach is the Transformational '
            'Ethical Story Telling (T.E.S.T.) Framework, placing the wellbeing, agency and safety of Story Holders at the centre '
            'of how stories are invited, developed and shared.</p>'
            '<p class="links"><a href="https://www.ourrace.com.au/">ourrace.com.au</a><a href="https://www.ourrace.com.au/t-e-s-t">The T.E.S.T. Framework</a>'
            '<a href="https://www.instagram.com/our_race/">Instagram</a><a href="https://www.linkedin.com/company/our-race/">LinkedIn</a></p>'
            + DOUG + HAWA + '</div></section>'),
 'share': ('<section class="fac"><div class="narrow"><p class="label">With you in Share</p>' + RU
           + '<p class="about" style="margin-top:18px">A host sits at every table.</p></div></section>'),
}

# ---------- the three sessions ----------
def step(n, title, inner):
    return f'<li class="stp" id="step-{n}"><span class="sn" aria-hidden="true">{n}</span><div class="sb"><h2>{title}</h2>{inner}</div></li>'

def mini_form(name, inner, button, hidden=''):
    return f'''<form name="{name}" method="POST" action="/thanks" data-netlify="true" netlify-honeypot="bot-field" data-form>
<input type="hidden" name="form-name" value="{name}">{hidden}
<p class="bot"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
{inner}
<div class="submit"><button class="btn" type="submit">{button}</button></div>
</form>'''

def session_page(path, key, name, time, script_word, lead, steps_html, title):
    nums = re.findall(r'<li class="stp" id="step-(\d+)">', steps_html)
    jump = ('<nav class="jump" aria-label="Steps on this page"><span>Go to step</span>'
            + ''.join(f'<a href="#step-{n}" aria-label="Step {n}">{n}</a>' for n in nums) + '</nav>')
    body = f'''<section class="page-hero s-{key}">
{RING}
<div class="narrow">
<p class="label">{time}. Civic Gallery, Level 4</p>
<h1>{name}</h1>
<p class="script">{script_word}</p>
<p class="lead">{lead}</p>
{jump}
</div>
</section>
{FAC[key]}
<section class="form"><div class="narrow">
<ol class="steps">
{steps_html}
</ol>
<p class="hold">{HOLD}</p>
</div></section>'''
    page(path, title, lead, body, current=key, noindex=True, script=True)

START = ('<p>The arrival survey. 10 short questions about you and your community, with no name.</p>'
         '<p><a class="btn" href="/arrival-survey" data-key="arrival-survey">Start your day</a></p>')
END = ('<p>The end of day survey. About five minutes on what you heard, who you met and what you will carry home.</p>'
       '<p><a class="btn" href="/end-of-day-survey" data-key="end-of-day-survey">End your day</a></p>')

hear_steps = '\n'.join([
    step(1, 'First session today? Start your day',
         '<p>Dr Ru gives the room five minutes for this after the welcome.</p>' + START),
    step(2, 'What happens in Hear',
         '<ul class="list"><li><strong>10am to 10.30am.</strong> Welcome to Country and an opening reflection, then five minutes to start your day on the app.</li>'
         '<li><strong>About 45 minutes.</strong> A conversation with a children’s author, who reads from his book. Spoken word from DEFNE, and a conversation with her.</li>'
         '<li><strong>About 45 minutes.</strong> Dr Ru’s three questions. Your answers come up on the screen and the room talks about them.</li>'
         '<li>Doug from Our Race sets up Create before lunch.</li></ul>'
         '<p>Hear sets the tone for the day and begins drawing out its themes: belonging, resilience, allyship and community.</p>'),
    step(3, '<span id="q"></span>Dr Ru’s three questions',
         '<p>Finish each sentence in your own words. Answer one, two or all three.</p>'
         + mini_form('in-my-community',
                     big_area('i_like', 'In my community, I like', rows=3)
                     + big_area('i_do_not_like', 'In my community, I do not like', rows=3)
                     + big_area('i_wish', 'In my community, I wish', rows=3)
                     + '<p class="filemsg" data-pollmsg hidden></p>',
                     'Send my answers')
         + '<p class="hint" style="margin-top:14px">No name. Your answers show on the screen in the room, so everyone can see what the room is saying. ' + CARE + '</p>'
         + '<p><a class="btn ghost" href="/results">See what the room is saying</a></p>'
         + '<script src="/js/poll.js" defer></script>'),
    step(4, 'Quick fire',
         '<p>Seven quick questions from Dr Ru. These do not go on the screen.</p>'
         + mini_form('quick-fire',
                     picks([('confident_making_friends_in_neighbourhood', 'Do you feel confident you can make friends in your neighbourhood?',
                             ['Very confident', 'Confident', 'Not confident']),
                            ('how_often_speak_to_neighbours', 'How often do you speak to your neighbours?',
                             ['At least once a week', 'Once a month', 'Very rarely', 'Have never spoken to them']),
                            ('neighbours_help_one_another', 'Do people in your neighbourhood help one another when someone needs it?',
                             ['Yes, all the time', 'Sometimes', 'Never']),
                            ('feel_safe_walking_in_neighbourhood', 'How safe do you feel when you walk around your neighbourhood?',
                             ['Very safe', 'Sometimes safe', 'Not safe at all']),
                            ('know_where_to_find_volunteering', 'If you wanted to volunteer, do you know where you could go to find more information about volunteering?',
                             ['Yes, I know', 'I am not sure', 'I don’t know', 'I do not want to volunteer']),
                            ('confident_about_future', 'How confident do you feel about your future?',
                             ['Very confident', 'Confident', 'Unsure', 'Not confident at all']),
                            ('left_out_or_seen_left_out', 'Have you been left out, or seen someone else left out, because of race, sexuality or neurodivergence?',
                             ['Often', 'Sometimes', 'Rarely', 'Never'])])
                     + '<p class="hint" style="margin-top:18px">No name. Skip any you like.</p>',
                     'Send')),
    step(5, 'Anything else that stayed with you?',
         mini_form('through-the-day',
                   big_area('insight', 'What stayed with you from Hear?', rows=4),
                   'Send my reflection', '<input type="hidden" name="session" value="Hear">')
         + '<p class="hint" style="margin-top:14px">No name. Send as many as you like.</p>'),
    step(6, 'Staying on, or heading off?',
         '<p><strong>Staying.</strong> Lunch is at 12pm for everyone, and Create starts at 12.45pm.</p>'
         '<p><a class="btn ghost" href="/lunch">Go to lunch</a></p><p style="margin-top:22px"><strong>Leaving after Hear.</strong></p>' + END),
])
session_page('hear.html', 'hear', 'Hear', '10am to 12pm', 'local stories.',
             'Local voices on what it takes to belong in Parramatta. Coming just to listen is taking part.',
             hear_steps, 'Hear. Our Stories, Parramatta')

create_steps = '\n'.join([
    step(1, 'First session today? Start your day', START),
    step(2, 'What happens in Create',
         '<ul class="list"><li>Two rooms with Our Race: a storytelling workshop for adults, and a writing and performance session for ages 15 to 25.</li>'
         '<li>Why the T.E.S.T. Framework matters. Being a story holder. Choosing what to share and what to keep.</li>'
         '<li>Short exercises that start a story in an easy way, then space to develop your own.</li>'
         '<li>At the end, time to send your story on the app if you want to, and to say if you would like a stage spot in Share.</li></ul>'
         '<p>Nobody under 18 joins any session without a parent or guardian’s <a href="/consent">consent form</a>.</p>'
         '<div class="cue c-create"><h3>You are the Story Holder</h3>'
         '<p>A Story Holder is the person who has lived the story. You own it, and you choose whether to share it. '
         'Step 3 takes you through the questions to ask yourself first.</p>'
         '<p>You have the right to decide if, when and how your story is shared. If you decide later that you no longer want to, that is OK too.</p>'
         '<p><a class="btn ghost" href="/Our_Race_Story_Holder_Guide.pdf">Read the Story Holder guide (PDF)</a></p></div>'
         '<div class="cue c-create"><h3>The five T.E.S.T. Principles</h3>'
         '<p>Transformational Ethical Story Telling (T.E.S.T.) is Our Race’s framework for keeping the Story Holder at the centre. '
         'Its five principles are what it asks of anyone who takes care of someone else’s story.</p>'
         '<ul class="list">'
         '<li><strong>Free, prior and ongoing informed consent.</strong> You are told the purpose, the risks and the benefits before your story is shared or used again, so the decision is yours.</li>'
         '<li><strong>Resourcing and sensitivity.</strong> Sharing a story can be hard. The people asking for it give you the practical, emotional and cultural support you need.</li>'
         '<li><strong>Further empowerment.</strong> You hold the decision over how your story is used, without pressure.</li>'
         '<li><strong>Co-design and collaboration.</strong> You stay involved in how your story is edited and framed.</li>'
         '<li><strong>Integrity of Story.</strong> Your story is not changed or adapted without your consent.</li>'
         '</ul>'
         '<p><a class="btn ghost" href="/TEST_Principles_2026.pdf">Read the T.E.S.T. Principles (PDF)</a></p></div>'),
    step(3, 'Check in with yourself',
         '<p>Six questions drawn from Our Race’s guide for Story Holders. Tap an answer for each. Nothing here is sent or saved. It is for you.</p>'
         + self_check(['Is it clear why I am being asked to share my story?',
                       'Do I feel safe and comfortable sharing it today?',
                       'Do I know who will hear it, and whether it will be recorded?',
                       'Have I had time to reflect on the story I want to tell?',
                       'Do I know who I can talk to afterwards?',
                       'Do I know what happens if I change my mind?'],
                      ['Yes', 'Not yet', 'Not sure'])
         + '<div class="cue c-create"><h3>Any “Not yet” or “Not sure”?</h3>'
         '<p>Talk to Doug or Hawanatu before you share. You can also keep your story for another day. '
         'You decide if, when and how it is shared.</p></div>'),
    step(4, 'Your story',
         '<p>Write it here if you want to, in full, with or without your name. Wrote it by hand? Take a photo of the page and send that. It does not need to be finished or tidy. You decide what you tell.</p>'
         '<p><a class="btn" href="/share-your-story">Share your story</a></p>'),
    step(5, '<span id="stage"></span>A stage spot in Share',
         '<p>Stage spots come after the circles in Share. They are photographed and filmed. Only if you want one. Your facilitators confirm the time for each spot on the day.</p>'
         + mini_form('stage-spot',
                     text('name', 'Your name, so we can call you up', required=True, extra=' autocomplete="name"')
                     + '<div class="field"><span style="font-size:17px;font-weight:600">How long would you like?</span></div>'
                     + opts('minutes', ['2 minutes', '3 minutes', '4 minutes', '5 minutes'], required=True, cols=True),
                     'Put my name down')),
    step(6, 'Staying on, or heading off?',
         '<p><strong>Staying.</strong> Share starts at 3pm.</p><p><a class="btn ghost" href="/share">Go to Share</a></p>'
         '<p style="margin-top:22px"><strong>Leaving after Create.</strong></p>' + END),
])
session_page('create.html', 'create', 'Create', '12.45pm to 2.45pm', 'your own story.',
             'Shape your own story with Our Race. You decide what you tell, and what you keep.',
             create_steps, 'Create. Our Stories, Parramatta')

share_steps = '\n'.join([
    step(1, 'First session today? Start your day', START),
    step(2, 'What happens in Share',
         '<ul class="list"><li><strong>About 45 minutes in circles.</strong> You share and listen at your table, with a host.</li>'
         '<li><strong>About half an hour on stage.</strong> A performer opens, then anyone who chose a stage spot shares. The stage is photographed and filmed.</li>'
         '<li><strong>A web of connection.</strong> Back at your table, a ball of wool goes from person to person as you say what you heard from each other that helped you feel connected.</li>'
         '<li>Closing reflections and what happens next. We finish by 4.50pm.</li></ul>'),
    step(3, 'On stage, or read for you',
         '<p><strong>Want to share on stage?</strong></p><p><a class="btn ghost" href="/create#stage">Put my name down for a stage spot</a></p>'
         '<p style="margin-top:26px"><strong>Rather stay in your seat?</strong> Write it here and a volunteer or performer reads it from the stage for you.</p>'
         + mini_form('read-for-me',
                     big_area('to_read_out', 'What you would like read out', rows=6)
                     + text('first_name', 'A first name to read with it, if you want one'),
                     'Send it to be read')
         + '<p class="hint" style="margin-top:14px">What is read from the stage is filmed with the stage. ' + CARE + '</p>'),
    step(4, 'Your circle’s message',
         mini_form('circle-message',
                   big_area('message', 'What should the people who run this city understand from what we heard today?', rows=5)
                   + text('table', 'Your table, if it has a number', cls='short'),
                   'Send our message')
         + '<p class="hint" style="margin-top:14px">One message from your circle. Anyone at the table can send it. ' + CARE + '</p>'),
    step(5, 'More to say?',
         '<p>Tell your story in full, with or without your name, and add pictures if you like.</p><p><a class="btn ghost" href="/share-your-story">Share your story</a></p>'),
    step(6, 'Before you leave', END),
])
session_page('share.html', 'share', 'Share', '3pm to 5pm', 'in a small circle.',
             'Tell your story in a small circle, or simply listen.',
             share_steps, 'Share. Our Stories, Parramatta')



# ---------- live results ----------
def wall_cols():
    def col(key, label, cls):
        return (f'<section class="wcol {cls}" data-col="{key}"><h2><span>{label}</span><b class="count">0</b></h2>'
                f'<ul class="answers"></ul></section>')
    return (col('i_like', 'In my community, I like', 'w1') + col('i_do_not_like', 'In my community, I do not like', 'w2')
            + col('i_wish', 'In my community, I wish', 'w3'))

HOSTBAR = ('<div class="hostbar" data-hostbar hidden><label>Host code <input type="password" autocomplete="off"></label>'
           '<b class="waitcount" data-waitcount>0 waiting</b>'
           '<button type="button" class="btn small" data-showall>Show all waiting</button>'
           '<label class="holdlabel"><input type="checkbox" data-hold checked> Hold answers until I show them</label>'
           '<button type="button" class="btn small ghost" data-clear>Clear all answers</button></div>')
WAITNOTE = '<p class="waitnote" data-waitnote hidden></p>'


resultsp = hero('Hear. Dr Ru’s three questions', 'What the room', 'is saying.',
                'Live, as people send their answers. No names.', cls=' s-hear') + f'''
<section class="form"><div class="wrap">
<p class="filemsg" data-status hidden></p>
{HOSTBAR}
{WAITNOTE}
<div class="wall is-empty" data-wall>
<p class="empty">No answers on the screen yet.</p>
{wall_cols()}
</div>
<p style="margin-top:40px"><a class="btn" href="/hear#q">Add your answers</a></p>
</div></section>
<script src="/js/poll.js" defer></script>'''
page('results.html', 'What the room is saying. Our Stories, Parramatta',
     'Live answers to Dr Ru’s three questions.', resultsp, current='hear', noindex=True, script=True)

screen = f'''<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Live screen. Our Stories, Parramatta</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/css/site.css"></head>
<body class="screen">
<header class="shead">
<img src="/img/our-stories.png" alt="Our Stories, Parramatta" class="slogo">
<div class="sjoin"><div><p class="sk">Scan, then tap Hear, the light blue one</p><p class="su">ourstoriesparramatta.netlify.app</p></div>
<img src="/img/qr-home.svg" alt="QR code that opens the app" class="sqr"></div>
</header>
<p class="filemsg" data-status hidden></p>
{HOSTBAR}
{WAITNOTE}
<main class="wall is-empty" data-wall>
<p class="empty">Finish the sentence on your phone. Your answer appears here. No names.</p>
{wall_cols()}
</main>
<footer class="sfoot"><span><b data-total>0</b> answers so far</span><span>Our Stories, Parramatta. Saturday 28 November 2026</span></footer>
<script src="/js/poll.js" defer></script>
</body></html>'''
open(os.path.join(ROOT, 'screen.html'), 'w').write(screen)

# ---------- lunch ----------
lunchp = f'''<section class="page-hero s-lunch">
{RING}
<div class="narrow">
<p class="label">12pm to 12.45pm. Civic Gallery foyer, Level 4</p>
<h1>Lunch</h1>
<p class="script">is on us.</p>
<p class="lead">Lunch is for everyone attending any session, whether you came for Hear, Create, Share or the whole day.</p>
</div>
</section>
<section class="fac"><div class="narrow"><p class="label">Lunch is by Racha’s Syrian Kitchen</p>
<p class="about">Bold and authentic Syrian food from traditional recipes, by a lover of good food, storytelling and family gatherings. Racha’s Syrian Kitchen caters events, teaches cooking classes and runs a pop up kitchen.</p>
<p class="links"><a href="https://www.rachasyriankitchen.com.au">rachasyriankitchen.com.au</a><a href="https://www.instagram.com/racha_syrian_kitchen/">Instagram</a></p>
</div></section>
<section class="form"><div class="narrow">
<ol class="steps">
{step(1, 'What is on', '<ul class="list"><li>All food is halal, with gluten free, vegetarian and vegan options.</li><li>Tea and coffee are on a table in the foyer.</li><li>If you have a nut allergy or any other allergy, tell us at the welcome desk before you eat.</li></ul>')}
{step(2, 'While you eat', '<p>Cultural dance, and a conversation between a flautist and an electric guitarist.</p>')}
{step(3, 'Got a minute?', '<p>Tell us what stayed with you this morning, or share your story in full, with or without your name.</p><p><a class="btn" href="/during">Add your voice</a></p><p><a class="btn ghost" href="/share-your-story">Share your story</a></p>')}
{step(4, 'Next', '<p><strong>Just arrived for the afternoon?</strong></p>' + START + '<p style="margin-top:22px"><strong>Create starts at 12.45pm.</strong></p><p><a class="btn ghost" href="/create">Go to Create</a></p>')}
</ol>
</div></section>'''
page('lunch.html', 'Lunch. Our Stories, Parramatta',
     'Lunch at Our Stories, Parramatta, by Racha’s Syrian Kitchen.', lunchp, current='lunch', script=True)


# ---------- facilitators ----------
fac_inner = '\n'.join([
    q(1, 'You', text('name', 'Your name', required=True, extra=' autocomplete="name"')
      + '<div class="field"><span style="font-size:17px;font-weight:600">Which sessions were you in?</span></div>'
      + opts('sessions[]', ['Hear', 'Create', 'Share'], kind='checkbox', cols=True)),
    q(2, 'What you heard', big_area('heard', 'What did you hear in the room that the surveys will not capture?', rows=6)),
    q(3, 'What shifted', big_area('shifted', 'What changed in the room across your session?', rows=5)),
    q(4, 'For the report', big_area('report', 'What should the report not miss?', rows=5),
      'Leave out participants’ names and anything that could identify them.'),
    q(5, 'Pictures', pics('fpic'),
      'Optional. Up to five. Butcher’s paper, table notes, the wall, the room. Leave out anyone wearing a bright sticker, and the small circles in Share.'),
])
facp = hero('For facilitators and hosts', 'What you heard', 'from the room.',
            'Cues for your script, and five minutes of reflection at the end of the day. Your reflections go into the report as what our facilitators heard.') + f'''
<section class="form"><div class="narrow prose">
<h2>Where to send the room, session by session</h2>
<p>One QR code opens the app. Each session has its own colour in the menu and at the top of its page, so you can say the colour.</p>
<div class="cue c-hear"><h3>Hear. Light blue</h3><ul class="list">
<li><strong>As people arrive.</strong> Put <a href="/">the main page of the app</a> on the projector. It opens with the welcome and the QR code.</li>
<li><strong>After the welcome.</strong> “Open the app and tap Start your day.” Five minutes.</li>
<li><strong>The three questions.</strong> “Tap Hear, the light blue one, and go to step 3.” Put <a href="/screen">the live screen</a> on the projector. Answers wait until a host shows them: on a second phone or laptop open <a href="/screen#host">the screen with host controls</a>, enter the host code and tap Show all waiting.</li>
<li><strong>Quick fire.</strong> “Step 4 on the same page.” These do not show on the screen.</li>
<li><strong>Before lunch.</strong> “If you are leaving now, tap End your day.”</li></ul></div>
<div class="cue c-lunch"><h3>Lunch. Pink</h3><ul class="list"><li><strong>Going to lunch.</strong> “Tap Lunch, the pink one, for what is on and what is in the food.”</li></ul></div>
<div class="cue c-create"><h3>Create. Green</h3><ul class="list">
<li><strong>At the start.</strong> “New today? Tap Start your day first.”</li>
<li><strong>Before people write.</strong> “Tap Create, the green one. Step 3, check in with yourself.” Six questions. Nothing is sent or saved.</li>
<li><strong>At the end.</strong> “Step 4 to send your story, with or without your name. Photos of your pages are fine.”</li>
<li><strong>Stage spots.</strong> “Step 5 to put your name down for the stage.” You can enter a name for someone.</li></ul></div>
<div class="cue c-share"><h3>Share. Purple</h3><ul class="list">
<li><strong>Before the stage.</strong> “Tap Share, the purple one. Step 3 if you would rather we read it for you.”</li>
<li><strong>At the tables.</strong> “Step 4 for one message from your circle.”</li>
<li><strong>Before 4.50pm.</strong> “Tap End your day before you go.”</li></ul></div>
<p class="hint">Host controls for the live screen: open <a href="/screen#host">the screen with host controls</a> and enter the host code. You can show one answer or all of them, hide an answer, or untick the hold so answers show straight away.</p>

<h2 style="margin-top:56px">Your reflection at the end of the day</h2>
<div class="note"><p>{HOLD}</p></div>
{form('facilitator-reflection', fac_inner, 'Send my reflection', multipart=True)}
</div></section>'''
page('facilitators.html', 'Facilitator reflection. Our Stories, Parramatta',
     'End of day reflection for facilitators and hosts.', facp, noindex=True, script=True, guard='host')

def gate(role, who, other=''):
    other = f'<p class="filemsg" data-gateother hidden>{other}</p>' if other else ''
    return f'''<section class="form" data-gate data-role="{role}"><div class="narrow prose">
<h2 style="margin-top:0">Enter the {who} password</h2>
<p>It is given out at the briefing. If you do not have it, ask Thom or Kyriakos.</p>
<form class="gate" data-gateform>
<div class="field"><label for="teampw">Password</label>
<input type="password" id="teampw" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" required></div>
<button type="submit" class="btn">Go in</button>
</form>
<p class="filemsg" data-gatemsg hidden>That password is not right. Try again, or ask Thom or Kyriakos.</p>
{other}
</div></section>'''

# ---------- volunteers ----------
volp = hero('Volunteer pack', 'Thank you for', 'being part of this.',
            'Where to be, what to do and who to ask on Saturday 28 November 2026 at PHIVE, Parramatta.') + f"""
<section class="section" id="before">
<div class="wrap two">
<div>
<p class="label">Before Saturday</p>
<h2>Three things to do now</h2>
<p><strong>Volunteer briefing.</strong> Thursday 26 November, 3.30pm to 4.30pm, on Microsoft Teams.</p>
<p><strong>Parking.</strong> If you need a space in the PHIVE car park, send your car registration to Thom now so he can arrange it. The entrance is on the corner of Smith Street and Darcy Street.</p>
<p><strong>Access.</strong> If you have an access or medical need we should know about, tell Thom before Saturday.</p>
</div>
<div>
<p class="label">On the day</p>
<h2>Arrive at 9am</h2>
<p><strong>Where.</strong> Civic Gallery, Level 4, PHIVE, 5 Parramatta Square. Doors open to the public at 9.30am and the first session starts at 10am.</p>
<p><strong>What to wear.</strong> A black shirt. Your volunteer badge is at the welcome desk. Wear it all day so people know who to ask.</p>
<p><strong>Lunch.</strong> At 12pm, and it is for you too.</p>
<p><strong>Coffee before 9am.</strong> Little Duck, 3 Parramatta Square, is across the square from PHIVE. Bourke Street Bakery, Church Street, is two minutes away.</p>
<p>Getting to PHIVE, other parking and Wi-Fi are in the <a href="/welcome#venue">welcome pack</a>.</p>
</div>
</div>
</section>

<section class="section tint" id="day">
<div class="wrap">
<p class="label">Your day at a glance</p>
<h2>Where volunteers are needed</h2>
<p class="intro">Your job is to make it easy for people to speak and safe for them to be heard.</p>
<ol class="glance">
{row('9am', '<strong>Set up.</strong> Rooms, the welcome desk, signage, camera free tables and a support card on every table.', 'Civic Gallery, Level 4')}
{row('9.30am', '<strong>Doors open.</strong> Sign people in, hand out name badges and bright stickers, and point people to Start your day in the app.', 'Welcome desk, Level 4')}
{row('10am to 12pm', '<strong>Hear.</strong> Welcome to Country at 10.05am, conversation, performance and the room’s first poll.', 'Civic Gallery, Level 4')}
{row('11.15am', '<strong>Catering arrives</strong> and sets up.', 'Civic Gallery foyer')}
{row('12pm to 12.45pm', '<strong>Lunch</strong> for everyone attending any session.', 'Civic Gallery foyer')}
{row('12.45pm to 2.45pm', '<strong>Create.</strong> A storytelling workshop for adults, and a writing and performance session for ages 15 to 25.', 'Adults: Civic Gallery')}
{row('2.45pm to 3pm', '<strong>Break.</strong> Reset the room into circles for Share.', 'Civic Gallery, Level 4')}
{row('3pm to 5pm', '<strong>Share.</strong> Small sharing circles, stage spots for people who opt in, the end of day survey and wrap up.', 'Civic Gallery, Level 4')}
{row('From 5pm', '<strong>Pack down.</strong> Collect equipment and signage. Then send <a href="#reflection">your reflection</a>.', 'All rooms')}
</ol>
</div>
</section>

<section class="section" id="app">
<div class="wrap two">
<div>
<p class="label">Helping people with the app</p>
<h2>Say the colour</h2>
<p>One QR code opens the app. Each session has its own colour in the menu and at the top of its page, so you can say the colour.</p>
<div class="cue c-hear"><h3>Hear. Light blue</h3><p>10am to 12pm.</p></div>
<div class="cue c-lunch"><h3>Lunch. Pink</h3><p>12pm. What is on and what is in the food.</p></div>
<div class="cue c-create"><h3>Create. Green</h3><p>12.45pm to 2.45pm.</p></div>
<div class="cue c-share"><h3>Share. Purple</h3><p>3pm to 5pm.</p></div>
</div>
<div>
<p class="label">What to tell people</p>
<h2>Start, add, end</h2>
<ul class="list">
<li><strong>Arriving.</strong> “Open the app and tap <a href="/arrival-survey">Start your day</a>.” People arriving for a later session do this first too.</li>
<li><strong>In a session.</strong> “Tap the session’s colour and follow the steps.”</li>
<li><strong>Telling a story.</strong> “Tap <a href="/share-your-story">Share your story</a>. You can send it with or without your name.”</li>
<li><strong>Leaving.</strong> “Tap <a href="/end-of-day-survey">End your day</a> before you go.” This applies to people leaving after one session too.</li>
<li><strong>Consent.</strong> The <a href="/consent">consent form</a> is in the menu at the top of every page.</li>
</ul>
</div>
</div>
</section>

<section class="section tint" id="ask">
<div class="wrap two">
<div>
<p class="label">If people ask</p>
<h2>The answers you will need</h2>
<p><strong>Do I have to stay all day?</strong> No. People can come to one session, two or all three.</p>
<p><strong>Do I have to speak?</strong> No. Coming just to listen is taking part. Nobody is asked to share anything they do not want to, and people can use their mother tongue.</p>
<p><strong>When can I come in?</strong> The welcome desk opens 30 minutes before each session.</p>
<p><strong>Is there lunch?</strong> Yes, at 12pm for everyone attending any session. All food is halal, with gluten free, vegetarian and vegan options.</p>
<p class="flag">People with a nut allergy or any other allergy are asked to tell the welcome desk.</p>
</div>
<div>
<p class="label">Open all day</p>
<h2>Spaces to point to</h2>
<p><strong>Quiet space, Level 4.</strong> In the foyer. People can step out of any session whenever they need to, and come back when they are ready.</p>
<p><strong>Creative space, Level 3.</strong> Booked all day. It can be used as a quiet space too, but nobody is stationed there.</p>
<p><strong>Prayer room, Level 3.</strong> On your left as you leave the lift. Press the intercom at the door.</p>
</div>
</div>
</section>

<section class="section" id="consent">
<div class="wrap two">
<div>
<p class="label">Photos, filming and consent</p>
<h2>Your image, your choice</h2>
<p>We are taking photos and video. People are in unless they say no, and saying no is easy.</p>
<ul class="list">
<li>A bright sticker means: do not photograph or film me, wide shots included. Stickers are at the welcome desk.</li>
<li>Camera free tables stay out of frame. Facilitators will point them out.</li>
<li>Nobody under 18 joins any session until a parent or guardian has filled in the <a href="/consent">consent form</a> for them.</li>
<li><strong>Signed on the day?</strong> Ask to see the “Thank you. That is in.” screen on their phone before they go in. For anyone under 18, see it on the parent’s or guardian’s phone.</li>
<li><strong>No phone?</strong> They can fill in the consent form on the welcome desk device. Paper copies of the consent form and both surveys are at the welcome desk too.</li>
<li>Nobody is named unless they choose to be.</li>
<li>People are told to tell any volunteer if they change their mind. If someone tells you, tell Kyriakos so the photo or clip is deleted.</li>
</ul>
</div>
<div>
<p class="label">Your own phone</p>
<h2>Ask before you post</h2>
<p>Ask before you photograph or record anyone’s story.</p>
<p>Share the day with #OurStoriesParramatta and tag SydWest. Ask before you post anyone’s face or story.</p>
<p>We follow the <a href="https://www.ourrace.com.au/story-support">Transformational Ethical Story Telling (T.E.S.T.) principles</a> from Our Race.</p>
</div>
</div>
</section>

<section class="section tint" id="care">
<div class="wrap">
<p class="label">Looking after people</p>
<h2>Some stories bring things up</h2>
<p class="intro">That is normal. A counsellor is on site from about 11am, and there is a support card on every table.</p>
<div class="two">
<div>
<h3>Do</h3>
<ul class="list">
<li>Thank every person who speaks, and every person who listens.</li>
<li>Keep time gently.</li>
<li>Watch for distress: going quiet, shaking, tears, leaving suddenly.</li>
<li>Offer a break and the counsellor, quietly.</li>
</ul>
</div>
<div>
<h3>Do not</h3>
<ul class="list">
<li>Dig into painful detail.</li>
<li>Ask anyone to repeat or explain their story.</li>
<li>Share a circle’s story outside it, or put a name to it.</li>
<li>Promise to keep a disclosure of harm secret.</li>
</ul>
</div>
</div>
<div class="two" style="margin-top:44px">
<div>
<h3>If someone is distressed</h3>
<p>Ask them privately what would help. Offer the quiet space and the counsellor. Do not leave them alone if they do not want to be. Point to the support card on the table. Tell Kyriakos or Thom once they are looked after.</p>
</div>
<div>
<h3>If someone discloses harm or is at risk</h3>
<p>Listen calmly. Do not investigate and do not promise secrecy. Tell Kyriakos or Thom straight away. For young people, the partner organisation’s child protection procedures apply.</p>
<p class="flag">In immediate danger, call triple zero (000).</p>
</div>
</div>
</div>
</section>

<section class="section" id="who">
<div class="wrap two">
<div>
<p class="label">Who to ask</p>
<h2>Anything this page does not answer</h2>
<p><strong>Thom Calma.</strong> SydWest lead. Parking, access and medical needs. If you are unwell and cannot come, call Thom as early as you can so your role can be covered.</p>
<p><strong>Kyriakos Gold.</strong> Just Gold, event lead. Set up, pack down and photos.</p>
<p><strong>PHIVE duty manager.</strong> One central number for whoever is on duty. Thom gives it out at the Thursday briefing.</p>
<p class="flag">In an emergency call triple zero (000) and follow the directions of PHIVE staff.</p>
</div>
<div>
<p class="label">Support numbers</p>
<h2>On every table too</h2>
{SUPPORT_FULL}
</div>
</div>
</section>
"""
vol_inner = '\n'.join([
    q(1, 'You', text('name', 'Your name', required=True, extra=' autocomplete="name"')
      + '<div class="field"><span style="font-size:17px;font-weight:600">Where were you on the day?</span></div>'
      + opts('where[]', ['Set up', 'Welcome desk', 'Hear', 'Lunch', 'Create', 'Share', 'Pack down'], kind='checkbox', cols=True)),
    q(2, 'What you heard or saw', big_area('heard', 'What did you hear or see that the surveys will not capture?', rows=6)),
    q(3, 'What worked', big_area('worked', 'What worked, and what should we do differently next time?', rows=5)),
    q(4, 'For the report', big_area('report', 'What should the report not miss?', rows=5),
      'Leave out participants’ names and anything that could identify them.'),
    q(5, 'Pictures', pics('vpic'),
      'Optional. Up to five. The welcome desk, the wall, the room. Leave out anyone wearing a bright sticker, and the small circles in Share.'),
])
VOL_FORM = f'''
<section class="form" id="reflection"><div class="narrow prose">
<p class="label">Before you go</p>
<h2 style="margin-top:0">Your reflection at the end of the day</h2>
<p>Five minutes, after pack down or on the way home. What you tell us goes into the report as what our volunteers saw and heard.</p>
{form('volunteer-reflection', vol_inner, 'Send my reflection', multipart=True)}
</div></section>
'''
MARK = '<section class="section" id="who">'
assert volp.count(MARK) == 1
volp = volp.replace(MARK, VOL_FORM + MARK)
_cut = volp.index('</section>') + len('</section>')
volp = (volp[:_cut] + gate('vol', 'volunteer') + '\n<div data-inside hidden>' + volp[_cut:]
        + '</div>\n<script src="/js/team.js" defer></script>')
page('volunteers.html', 'Volunteer pack. Our Stories, Parramatta',
     'The volunteer pack for Our Stories, Parramatta on Saturday 28 November 2026.', volp, current='volunteers', noindex=True, script=True)

# ---------- hosts, and the password gate ----------
COUNTS = '''<ul class="counts" data-counts>
<li><b data-c="arrival-survey">0</b><span>started their day</span></li>
<li><b data-c="in-my-community">0</b><span>answered the live poll</span></li>
<li><b data-c="quick-fire">0</b><span>did quick fire</span></li>
<li><b data-c="through-the-day">0</b><span>added their voice</span></li>
<li><b data-c="share-your-story">0</b><span>shared a story</span></li>
<li><b data-c="end-of-day-survey">0</b><span>ended their day</span></li>
<li><b data-c="consent">0</b><span>consent forms today</span></li>
</ul>'''

hostsp = hero('Hosts and facilitators', 'This part is', 'for hosts.',
              'Your cues, your reflection and the screens for the room on Saturday 28 November 2026.') + gate(
    'host', 'host', 'That is the volunteer password. This page needs the host password.') + '''
<section class="form" data-inside hidden><div class="narrow prose">
<h2 style="margin-top:0">Your page</h2>
<div class="teamgrid">
<a class="teamcard" href="/facilitators"><b>Cues and reflection</b><span>Where to send the room, session by session, and your reflection at the end of the day.</span></a>
<a class="teamcard alt" href="/volunteers"><b>Volunteer pack</b><span>What the volunteers have been told. Your password opens it too.</span></a>
</div>
<h2>Screens for the projector</h2>
<div class="teamgrid three">
<a class="teamcard alt" href="/"><b>Welcome and QR code</b><span>The main page. Put it up as people arrive.</span></a>
<a class="teamcard alt" href="/screen"><b>Live poll</b><span>Dr Ru’s three questions in Hear. Answers appear as the room sends them.</span></a>
<a class="teamcard alt" href="/screen#host"><b>Live poll, host controls</b><span>Show the answers that are waiting, hide one, or clear the screen. Needs the host code.</span></a>
</div>
<h2>Today so far</h2>
<p>How many of each have been sent today. Counts only, no names. It updates every 30 seconds.</p>
''' + COUNTS + '''
</div></section>
<script src="/js/team.js" defer></script>
<script src="/js/count.js" defer></script>'''
page('hosts.html', 'Hosts and facilitators. Our Stories, Parramatta',
     'For facilitators and hosts.', hostsp, current='hosts', noindex=True)


# ---------- welcome desk ----------
deskp = '''
<section class="form" data-deskgate><div class="narrow prose">
<p class="label">Welcome desk</p>
<h1 class="dh1">For the welcome desk and coordinators</h1>
<p class="flag" data-saved hidden>Saved. That consent form is in. Enter the password to open the desk again.</p>
<h2>Enter the welcome desk password</h2>
<p>It is given out at the briefing. If you do not have it, ask Thom or Kyriakos.</p>
<form class="gate">
<div class="field"><label for="deskpw">Password</label>
<input type="password" id="deskpw" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" required></div>
<button type="submit" class="btn">Go in</button>
</form>
<p class="filemsg" data-gatemsg hidden></p>
</div></section>
<section class="desk" data-deskinside hidden>
<div class="dtop"><div class="wrap">
<div class="dfind">
<label class="vh" for="dsearch">Find a name</label>
<input type="search" id="dsearch" data-search autocomplete="off" placeholder="Find a name">
<button type="button" class="dlock" data-lock>Lock</button>
</div>
<div class="dtabs" role="tablist" aria-label="Welcome desk">
<button type="button" role="tab" class="dtab is-on" data-tab="people" aria-selected="true">People <b data-t-people>0</b></button>
<button type="button" role="tab" class="dtab" data-tab="todo" aria-selected="false">To do <b data-t-todo>0</b></button>
<button type="button" role="tab" class="dtab" data-tab="day" aria-selected="false">The day</button>
<button type="button" role="tab" class="dtab" data-tab="counts" aria-selected="false">Counts</button>
</div>
</div></div>
<div class="wrap">
<p class="filemsg" data-deskstatus hidden></p>
<p class="hint dhx" data-hxnote hidden></p>
<div class="dpanels">
<div class="dpanel dp-people is-on" data-panel="people">
<h2>People</h2>
<p class="deskacts"><a class="btn small" href="/consent?desk=1" data-handover>Consent form on this device</a><span class="hint">Tap a name for the detail. The desk locks when you hand the device over.</span></p>
<div class="dchips" role="group" aria-label="Show">
<button type="button" class="dchip is-on" data-show="all">Everyone</button>
<button type="button" class="dchip" data-show="noconsent" data-hxonly hidden>No consent form yet</button>
<button type="button" class="dchip" data-show="sticker">Bright sticker</button>
<button type="button" class="dchip" data-show="young">Young people</button>
<button type="button" class="dchip" data-show="needs" data-hxonly hidden>Dietary and access</button>
<button type="button" class="dchip" data-show="here">Arrived</button>
<button type="button" class="dchip" data-show="nothere">Not arrived</button>
</div>
<ul class="dpeople" data-people></ul>
</div>
<div class="dpanel dp-todo" data-panel="todo">
<h2>To do</h2>
<p class="hint">Made from the consent forms as they come in. Tick each one when it is done. Every desk device sees the same list.</p>
<ul class="dlist" data-todo></ul>
<details class="ddone" data-donewrap hidden><summary>Done (<span data-donecount>0</span>)</summary><ul class="dlist" data-done></ul></details>
</div>
<div class="dpanel dp-day" data-panel="day">
<h2>The day</h2>
<ul class="dlist" data-run></ul>
</div>
<div class="dpanel dp-counts" data-panel="counts">
<h2>Counts</h2>
<ul class="counts dsum">
<li data-hxonly hidden><b data-n-booked>0</b><span>people booked</span></li>
<li><b data-n-people>0</b><span>people with a consent form</span></li>
<li data-hxonly hidden><b data-n-noconsent>0</b><span>booked, no consent form yet</span></li>
<li><b data-n-here>0</b><span>arrived</span></li>
<li><b data-n-stickers>0</b><span>bright stickers to hand out</span></li>
<li><b data-n-young>0</b><span>forms signed for young people</span></li>
</ul>
<h3>Sent today</h3>
<p class="hint">How many of each form have been sent today. Counts only, no names.</p>
''' + COUNTS + '''
</div>
</div>
</div></section>
<script src="/js/desk.js" defer></script>
<script src="/js/count.js" defer></script>'''
page('desk.html', 'Welcome desk. Our Stories, Parramatta',
     'For the welcome desk and coordinators.', deskp, current='desk', noindex=True)


# ---------- privacy ----------
privacyp = hero('Privacy notice', 'What we collect and', 'what we do with it.',
                'Plain answers about every form on this site.') + '''
<section class="form"><div class="narrow prose">

<div class="note">
<p><strong>The short version.</strong> Just Gold collects what you send on this site on behalf of SydWest Multicultural Services. Just Gold keeps the record for one month after Saturday 28 November 2026, then hands it to SydWest and deletes its own copy. Nothing you send is sold, used for marketing or shared with anyone else.</p>
</div>

<h2>Who is collecting it</h2>
<p>Our Stories, Parramatta is an initiative of SydWest and the City of Parramatta, funded by the NSW Government through the NSW Social Cohesion Grants for Local Government program. Just Gold Digital Agency Pty Ltd (Just Gold) runs this site and the evaluation of the day for SydWest.</p>

<h2>What each form collects</h2>
<ul class="list">
<li><strong>Arrival survey and end of day survey.</strong> No name, email or phone number. They ask your age range, some questions about you such as gender, country of birth, language and postcode, and what you think and feel. You can skip any question.</li>
<li><strong>Add your voice, the three questions in Hear and your circle’s message in Share.</strong> Only what you write, and the session or table if you tell us. No name.</li>
<li><strong>Quick fire in Hear.</strong> Seven tick questions about your neighbourhood, volunteering, your future and being left out. No name.</li>
<li><strong>Check in with yourself in Create.</strong> Not sent and not saved. Your answers are for you.</li>
<li><strong>A stage spot.</strong> Your name and how long you would like, so we can call you up.</li>
<li><strong>Read it for me.</strong> What you want read from the stage, and a first name only if you add one.</li>
<li><strong>Facilitator reflection.</strong> The facilitator’s or host’s name, what they heard in the room, and up to five pictures of the work if they add them.</li>
<li><strong>Your booking.</strong> On the day, the welcome desk can see the name on your Humanitix booking, the sessions you booked and anything you told us about dietary or access needs. It is read from Humanitix and is not copied into this site.</li>
<li><strong>Welcome desk list.</strong> When you send the consent form, your name and your choices about photos also go to a password protected list. The welcome desk uses it on the day to hand out bright stickers and to check that young people are covered. It does not hold your mobile number.</li>
<li><strong>Head count.</strong> Each time a form is sent, the app adds one to a count for that form. The count holds no names and no answers.</li>
<li><strong>Volunteer reflection.</strong> The volunteer’s name, where they were on the day, what they heard, saw and thought worked, and up to five pictures if they add them.</li>
<li><strong>Share your story.</strong> Your story, and up to five pictures if you add them. Your name and an email or phone number only if you choose to be named.</li>
<li><strong>Consent form.</strong> Your name, your choice about photos and video, and your typed signature. If you are signing for someone under 18, their name, your name and your mobile number.</li>
</ul>
<p>This site does not use advertising or tracking cookies. It keeps one small note in your own browser so the buttons can show which steps you have finished. That note stays on your phone.</p>

<h2>Why we collect it</h2>
<p>To understand what the day was like for the people who came, to report on it to SydWest, the City of Parramatta and the NSW Government, and to respect your choices about photos, video and your story.</p>

<h2>How it is used</h2>
<ul class="list">
<li>Survey answers and what you add through the day are reported as themes and numbers. In reporting, your responses will not be identifiable in any way.</li>
<li>If we quote something you wrote, identifying details are removed.</li>
<li>A story is published with a name only if the person who sent it chose to be named. Pictures sent with a story are used only with that story.</li>
<li>The consent form is used on the day so the photographer and volunteers know your choice.</li>
<li>Once the report is published, what you contributed to it cannot be taken out.</li>
</ul>

<h2>Who sees it</h2>
<p>Just Gold and SydWest. The City of Parramatta and the NSW Government receive the report, which carries no names unless a person chose to be named in a story.</p>

<h2>Where it is kept, and for how long</h2>
<ul class="list">
<li>What you send is stored by the company that hosts this site, Netlify, which is based in the United States, until Just Gold exports it.</li>
<li>Just Gold keeps the record for one month after Saturday 28 November 2026.</li>
<li>Just Gold then hands the record to SydWest and deletes its own copy, including the copy held by the site host.</li>
<li>After that, SydWest holds it under the <a href="https://sydwestms.org.au/privacy-policy/">SydWest privacy policy</a>.</li>
<li>SydWest and Just Gold will not use photos, video or recordings from the day after five years. The NSW Premier’s Department, which funds the day, may also use them.</li>
</ul>

<h2>Your choices</h2>
<ul class="list">
<li>Everything on this site is voluntary. You can take part in the day without filling in any survey.</li>
<li>You can change your photo and video choice at any time on the day by telling a volunteer at the welcome desk.</li>
<li>If you sent a story or a consent form, you can ask to see it, correct it or withdraw it. Contact us below.</li>
<li>The surveys and Add your voice carry no name, so we cannot find or remove one person’s answers after they are sent.</li>
</ul>

<h2>Contact</h2>
<p>Questions or requests about your information go to Kyriakos Gold at Just Gold, kyriakos@justgold.net. SydWest can be reached through <a href="https://sydwestms.org.au/">sydwestms.org.au</a>.</p>

</div></section>'''
page('privacy.html', 'Privacy notice. Our Stories, Parramatta',
     'How Our Stories, Parramatta collects, uses, keeps and hands over what you send on this site.', privacyp, current='privacy')

# ---------- thanks ----------
thanks = '''<section class="start">
<div class="wrap">
<p class="eyebrow">Received</p>
<h1 class="h-start">Thank you. That is in.</h1>
<p class="lead" style="margin:10px 0 24px">Back to your session, or on to the next step.</p>
''' + tiles() + '''<h2 class="h-sub">And for everyone, any time</h2>''' + actions() + '''
</div>
</section>'''
page('thanks.html', 'Thank you. Our Stories, Parramatta', 'Thank you.', thanks, noindex=True)

print('built')
