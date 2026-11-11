from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# Initialize presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5) # 16:9 Widescreen format

# Color Palette
NAVY = RGBColor(10, 25, 47)      # #0A192F (Corporate Navy)
GOLD = RGBColor(212, 175, 55)    # #D4AF37 (Aviation Gold)
WHITE = RGBColor(255, 255, 255)  # #FFFFFF
GRAY = RGBColor(100, 116, 139)   # #64748B (Slate Gray)
LIGHT_BG = RGBColor(248, 250, 252) # #F8FAFC

def set_slide_background(slide, color):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_header(slide, title_text, subtitle_text=""):
    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(0.8))
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = NAVY
    
    if subtitle_text:
        p2 = tf.add_paragraph()
        p2.text = subtitle_text
        p2.font.size = Pt(14)
        p2.font.color.rgb = GRAY
        p2.space_before = Pt(4)

# ==========================================
# SLIDE 1: Title Slide (Dark Theme)
# ==========================================
slide_layout = prs.slide_layouts[6] # Blank
slide1 = prs.slides.add_slide(slide_layout)
set_slide_background(slide1, NAVY)

title_box = slide1.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.3), Inches(3.5))
tf = title1 = title_box.text_frame
tf.word_wrap = True

p0 = tf.paragraphs[0]
p0.text = "✈️ ETHIOPIAN AIRLINES"
p0.font.size = Pt(18)
p0.font.color.rgb = GOLD
p0.font.bold = True

p1 = tf.add_paragraph()
p1.text = "Enterprise Innovation Hub"
p1.font.size = Pt(44)
p1.font.color.rgb = WHITE
p1.font.bold = True
p1.space_before = Pt(10)

p2 = tf.add_paragraph()
p2.text = "Secure IP Protection, Cross-Departmental Collaboration, & Automated Evaluation Engine"
p2.font.size = Pt(16)
p2.font.color.rgb = RGBColor(203, 213, 225)
p2.space_before = Pt(15)

# ==========================================
# SLIDE 2: Executive Summary & Vision
# ==========================================
slide2 = prs.slides.add_slide(slide_layout)
set_slide_background(slide2, LIGHT_BG)
add_header(slide2, "Executive Summary & Project Vision", "Transforming internal employee ingenuity into measurable operational breakthroughs.")

box = slide2.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.5))
tf = box.text_frame
tf.word_wrap = True

bullets = [
    ("The Core Vision: ", "A centralized, high-performance internal platform empowering employees across Maintenance, Flight Operations, IT, and Ground Handling at Bole International Airport."),
    ("Intellectual Property Protection: ", "Eliminates the 'trust gap' by instantly fingerprinting submissions with SHA-256 cryptographic hashes and generating verifiable Certificates of Authorship."),
    ("Meritocratic Innovation: ", "Combines peer upvoting gamification, leadership-driven Innovation Quests, and unbiased blind evaluator reviews into a single streamlined pipeline.")
]

for title, desc in bullets:
    p = tf.add_paragraph()
    p.space_after = Pt(14)
    run_title = p.add_run()
    run_title.text = "• " + title
    run_title.font.bold = True
    run_title.font.size = Pt(16)
    run_title.font.color.rgb = NAVY
    
    run_desc = p.add_run()
    run_desc.text = desc
    run_desc.font.size = Pt(15)
    run_desc.font.color.rgb = RGBColor(51, 65, 85)

# ==========================================
# SLIDE 3: Technical Architecture
# ==========================================
slide3 = prs.slides.add_slide(slide_layout)
set_slide_background(slide3, LIGHT_BG)
add_header(slide3, "Enterprise Technical Architecture", "Optimized for lightweight local performance, security, and scalability.")

tech_items = [
    ("Backend Runtime", "Node.js & Express.js RESTful architecture with secure session management."),
    ("Database Layer", "MySQL relational schema via XAMPP with foreign keys & cascading integrity."),
    ("Frontend & Styling", "Server-Side Rendered (SSR) EJS templates styled with Tailwind CSS CDN."),
    ("Security & Hashing", "Bcrypt password hashing, Multer file processing, and native Node.js SHA-256 crypto.")
]

for i, (t_title, t_desc) in enumerate(tech_items):
    col = i % 2
    row = i // 2
    left = Inches(0.8 + col * 5.9)
    top = Inches(1.8 + row * 2.5)
    
    box = slide3.shapes.add_textbox(left, top, Inches(5.6), Inches(2.2))
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = t_title
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = NAVY
    
    p2 = tf.add_paragraph()
    p2.text = t_desc
    p2.font.size = Pt(14)
    p2.font.color.rgb = RGBColor(71, 85, 105)
    p2.space_before = Pt(8)

# ==========================================
# SLIDE 4: Core Achievements - Security & Proof
# ==========================================
slide4 = prs.slides.add_slide(slide_layout)
set_slide_background(slide4, LIGHT_BG)
add_header(slide4, "Milestone 1: Security, Auth & Anti-Theft Engine", "Guaranteeing domain compliance and tamper-proof author credit.")

achievements_s4 = [
    ("Domain-Restricted Authentication", "Mandatory verification ensuring only personnel with official @ethiopianairlines.com emails can register and access the portal."),
    ("Instant Cryptographic Hashing", "Every uploaded CAD file, PDF, or prototype is read into a buffer and hashed instantly using SHA-256 upon submission."),
    ("Certificate of Authorship", "Generates an official, printable proof document displaying exact timestamps, unique fingerprints, and co-author allocations."),
    ("Role-Based Access Control", "Granular security permission tiers separating regular Employees, Department Evaluators, and System Administrators.")
]

for i, (title, desc) in enumerate(achievements_s4):
    top = Inches(1.8 + i * 1.25)
    box = slide4.shapes.add_textbox(Inches(0.8), top, Inches(11.7), Inches(1.1))
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    run1 = p.add_run()
    run1.text = "✓ " + title + ": "
    run1.font.bold = True
    run1.font.size = Pt(15)
    run1.font.color.rgb = NAVY
    
    run2 = p.add_run()
    run2.text = desc
    run2.font.size = Pt(14)
    run2.font.color.rgb = RGBColor(71, 85, 105)

# ==========================================
# SLIDE 5: Marketplace, Gamification & Quests
# ==========================================
slide5 = prs.slides.add_slide(slide_layout)
set_slide_background(slide5, LIGHT_BG)
add_header(slide5, "Milestone 2: Marketplace, Quests & Co-Creation", "Driving engagement through targeted challenges and peer recognition.")

features_s5 = [
    ("Innovation Marketplace & Search", "Dynamic feed with multi-parameter keyword search, department filters, status toggles, and vote/date sorting."),
    ("Peer Endorsement Gamification", "Secure upvoting system backed by unique database constraints to highlight top-voted solutions meritocratically."),
    ("Co-Creation & Co-Pilot Tagging", "Allows primary creators to tag colleague email handles during submission for joint credit on certificates and feeds."),
    ("Targeted Innovation Quests", "Empowers department heads to post operational problem statements that employees can directly solve.")
]

for i, (title, desc) in enumerate(features_s5):
    col = i % 2
    row = i // 2
    left = Inches(0.8 + col * 5.9)
    top = Inches(1.8 + row * 2.5)
    
    box = slide5.shapes.add_textbox(left, top, Inches(5.6), Inches(2.2))
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = NAVY
    
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(14)
    p2.font.color.rgb = RGBColor(71, 85, 105)
    p2.space_before = Pt(8)

# ==========================================
# SLIDE 6: Governance & Future Roadmap
# ==========================================
slide6 = prs.slides.add_slide(slide_layout)
set_slide_background(slide6, LIGHT_BG)
add_header(slide6, "Governance & Future Strategic Roadmap", "Maintaining administrative oversight and scaling platform impact.")

roadmap = [
    ("Evaluator Review Dashboards", "Streamlined review pipelines allowing managers to inspect submissions and update statuses without bias."),
    ("Admin Audit Trail & IP Tracker", "Immutable security logging tracking all actor interactions, views, and cryptographic signatures."),
    ("ROI & Impact Analytics", "Quantifying projected cost savings, fuel efficiency gains, and turnaround time reductions."),
    ("Expert Mentorship Matching", "Formal assignment of senior engineers to mentor high-potential junior submissions.")
]

for i, (title, desc) in enumerate(roadmap):
    top = Inches(1.8 + i * 1.25)
    box = slide6.shapes.add_textbox(Inches(0.8), top, Inches(11.7), Inches(1.1))
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    run1 = p.add_run()
    run1.text = "➔ " + title + ": "
    run1.font.bold = True
    run1.font.size = Pt(15)
    run1.font.color.rgb = NAVY
    
    run2 = p.add_run()
    run2.text = desc
    run2.font.size = Pt(14)
    run2.font.color.rgb = RGBColor(71, 85, 105)

# Save presentation
output_filename = "Ethiopian_Airlines_Innovation_Hub_PitchDeck.pptx"
prs.save(output_filename)
print(f"Success! PowerPoint presentation generated successfully: {output_filename}")