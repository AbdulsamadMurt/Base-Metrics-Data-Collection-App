import subprocess
import os

font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

scenes = [
    {
        "part": "PART 1: MULTI-SECTOR DATA COLLECTION",
        "title": "Base Metrics",
        "subtitle": "Universal Field Platform Replacing Paper Forms & KoboCollect",
        "bullet1": "[x] Multi-Sector: Education, Health, Agriculture, WASH, Humanitarian",
        "bullet2": "[x] Real-time synchronization to secure Google Cloud Firestore",
        "bullet3": "[x] Engineered for high visibility and reliable field operations",
        "color": "0x2ea043"
    },
    {
        "part": "PART 2: FACILITATOR & ENUMERATOR PORTAL",
        "title": "Offline-First Data Entry",
        "subtitle": "Continue Surveys & Attendance Even With Zero Network Signal",
        "bullet1": "[x] Automatic Local Outbox: Preserves records when offline",
        "bullet2": "[x] Background Auto-Sync as soon as internet connection restores",
        "bullet3": "[x] Disaggregated attendance tracking and comprehension testing",
        "color": "0x58a6ff"
    },
    {
        "part": "PART 3: SUPERVISOR AUDIT & VERIFICATION",
        "title": "Quality Assurance On-Site",
        "subtitle": "Tamper-Proof Geolocation Locks & Photographic Evidence",
        "bullet1": "[x] High-precision GPS lock: Latitude, Longitude, and Accuracy",
        "bullet2": "[x] Live camera photo audits of school centers & facility activities",
        "bullet3": "[x] Radio broadcast verification & curriculum compliance logs",
        "color": "0x2ea043"
    },
    {
        "part": "PART 4: B1 TASK ENGINE FOR CUSTOM WORK",
        "title": "Dynamic Questionnaires",
        "subtitle": "Deploy Any Custom Form Tailored To Any Client or Sector",
        "bullet1": "[x] Build custom numeric, text, choice, and boolean fields on demand",
        "bullet2": "[x] Organizations can commission data tasks via 'Hire Us' portal",
        "bullet3": "[x] Real-time dynamic questionnaire population for field agents",
        "color": "0xbc8cff"
    },
    {
        "part": "PART 5: ADMIN COMMAND CENTER",
        "title": "Governance & 1-Click CSV",
        "subtitle": "Centralized Account Control & Rapid Analytical Data Extraction",
        "bullet1": "[x] Unique one-time personal access codes for every field member",
        "bullet2": "[x] Master password verification gate protecting operational datasets",
        "bullet3": "[x] 1-Click clean CSV exports ready for Excel, SPSS, and Stata",
        "color": "0xf0883e"
    },
    {
        "part": "PART 6: DEPLOY IN SECONDS",
        "title": "Install on Any Phone",
        "subtitle": "Progressive Web App with Instant QR Barcode Setup",
        "bullet1": "[x] Scan QR barcode to install instantly on Android and iOS",
        "bullet2": "[x] Google OAuth & Limited Use policy compliance for secure login",
        "bullet3": "[x] Contact: murtalaabdulsamad142@gmail.com",
        "color": "0x2ea043"
    }
]

os.makedirs("/tmp/scenes", exist_ok=True)
os.makedirs("public", exist_ok=True)

segment_files = []

for i, s in enumerate(scenes):
    seg_output = f"/tmp/scenes/seg_{i}.mp4"
    segment_files.append(seg_output)
    
    # Build filter complex
    filters = [
        # Dark outer border and card box
        f"drawbox=x=80:y=100:w=1760:h=880:color=0x161b22@1:t=fill",
        f"drawbox=x=80:y=100:w=1760:h=880:color={s['color']}@0.6:t=4",
        # Top banner
        f"drawbox=x=80:y=100:w=1760:h=90:color=0x21262d@1:t=fill",
        f"drawbox=x=80:y=186:w=1760:h=4:color={s['color']}@1:t=fill",
        # Header text
        f"drawtext=fontfile='{font_path}':text='BASE METRICS | Universal Field Platform':fontcolor=white:fontsize=28:x=120:y=132",
        f"drawtext=fontfile='{font_path}':text='{s['part']}':fontcolor={s['color']}:fontsize=26:x=1840-text_w-60:y=132",
        # Main Title
        f"drawtext=fontfile='{font_path}':text='{s['title']}':fontcolor=white:fontsize=64:x=140:y=240",
        # Subtitle
        f"drawtext=fontfile='{font_path}':text='{s['subtitle']}':fontcolor=0x8b949e:fontsize=32:x=140:y=325",
        # Divider line
        f"drawbox=x=140:y=385:w=1640:h=2:color=0x30363d@1:t=fill",
        # Bullet 1
        f"drawtext=fontfile='{font_path}':text='{s['bullet1']}':fontcolor=0xf0f6fc:fontsize=36:x=140:y=450",
        # Bullet 2
        f"drawtext=fontfile='{font_path}':text='{s['bullet2']}':fontcolor=0xf0f6fc:fontsize=36:x=140:y=555",
        # Bullet 3
        f"drawtext=fontfile='{font_path}':text='{s['bullet3']}':fontcolor=0xf0f6fc:fontsize=36:x=140:y=660",
        # Footer bar
        f"drawbox=x=80:y=910:w=1760:h=50:color=0x090d13@1:t=fill",
        f"drawtext=fontfile='{font_path}':text='Scene {i+1} of 6  |  Base Metrics Data Engine':fontcolor=0x8b949e:fontsize=22:x=120:y=924",
        f"drawtext=fontfile='{font_path}':text='murtalaabdulsamad142@gmail.com':fontcolor=0x8b949e:fontsize=22:x=1840-text_w-60:y=924",
        # Fades
        "fade=t=in:st=0:d=0.4",
        "fade=t=out:st=7.4:d=0.4"
    ]
    
    vf = ",".join(filters)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "color=c=0x090d13:s=1920x1080:d=7.8",
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
        seg_output
    ]
    subprocess.run(cmd, check=True)
    print(f"Rendered segment {i+1}/6")

# Create concat list
concat_list_path = "/tmp/scenes/concat.txt"
with open(concat_list_path, "w") as f:
    for seg in segment_files:
        f.write(f"file '{seg}'\n")

# Concatenate all video segments
final_video_no_audio = "/tmp/scenes/video_no_audio.mp4"
subprocess.run([
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_list_path,
    "-c", "copy",
    final_video_no_audio
], check=True)
print("Segments concatenated.")

# Generate gentle harmonious background audio track (46.8 seconds)
audio_track = "/tmp/scenes/audio.aac"
subprocess.run([
    "ffmpeg", "-y",
    "-f", "lavfi",
    "-i", "aevalsrc=0.03*sin(2*PI*220*t)+0.02*sin(2*PI*330*t)+0.015*sin(2*PI*440*t):s=44100:d=46.8",
    "-af", "afade=t=in:st=0:d=1,afade=t=out:st=45:d=1.8",
    "-c:a", "aac", "-b:a", "128k",
    audio_track
], check=True)
print("Audio generated.")

# Merge video and audio into final output
final_output = "public/BaseMetrics_App_Walkthrough.mp4"
subprocess.run([
    "ffmpeg", "-y",
    "-i", final_video_no_audio,
    "-i", audio_track,
    "-c:v", "copy",
    "-c:a", "aac",
    "-shortest",
    final_output
], check=True)

print("SUCCESS: Final video written to", final_output)
file_size = os.path.getsize(final_output) / (1024 * 1024)
print(f"File size: {file_size:.2f} MB")
