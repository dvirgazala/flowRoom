-- ============================================================
-- FlowRoom — regulatory_rules table
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS regulatory_rules (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  body             TEXT        NOT NULL,
  kind             TEXT        NOT NULL DEFAULT 'body_meta',
  label            TEXT,
  content_json     JSONB       NOT NULL DEFAULT '{}',
  effective_from   TIMESTAMPTZ DEFAULT NOW(),
  effective_until  TIMESTAMPTZ,
  source_url       TEXT,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by      TEXT        DEFAULT 'FlowRoom Team',
  version          INTEGER     DEFAULT 1,
  supersedes_id    UUID        REFERENCES regulatory_rules(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_body ON regulatory_rules(body);
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_kind ON regulatory_rules(kind);

-- Row Level Security
ALTER TABLE regulatory_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read regulatory rules" ON regulatory_rules;
CREATE POLICY "Public read regulatory rules"
  ON regulatory_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated write regulatory rules" ON regulatory_rules;
CREATE POLICY "Authenticated write regulatory rules"
  ON regulatory_rules FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED — body_meta rows (mirrors BODIES constant in rights/page.tsx)
-- ============================================================

INSERT INTO regulatory_rules (body, kind, label, source_url, content_json, last_verified_at, verified_by)
VALUES
  (
    'acum', 'body_meta', 'אקו"ם',
    'https://www.acum.org.il/',
    '{
      "short": "ACUM",
      "color": "text-purple",
      "tint": "bg-purple/10",
      "ring": "border-purple/30",
      "blurb": "תמלוגי ביצוע ציבורי ושכפול — למלחינים ופזמונאים. כל שיר שיוצא חייב להיות רשום.",
      "relevantSplit": "publishing"
    }',
    NOW(), 'FlowRoom Team'
  ),
  (
    'pil', 'body_meta', 'הפיל',
    'https://www.pil.org.il/',
    '{
      "short": "PIL",
      "color": "text-pink",
      "tint": "bg-pink/10",
      "ring": "border-pink/30",
      "blurb": "הפדרציה לתקליטים — מייצגת מפיקים ובעלי מאסטר מול רדיו, פלאיליסטים, אירועים.",
      "relevantSplit": "master"
    }',
    NOW(), 'FlowRoom Team'
  ),
  (
    'eshkolot', 'body_meta', 'אשכולות',
    'https://eshkolot.com/',
    '{
      "short": "Eshkolot",
      "color": "text-warning",
      "tint": "bg-warning/10",
      "ring": "border-warning/30",
      "blurb": "אמנים מבצעים — גובה זכויות שכנות (neighboring rights) לזמרים ולנגנים.",
      "relevantSplit": "master"
    }',
    NOW(), 'FlowRoom Team'
  ),
  (
    'distributor', 'body_meta', 'דיסטריביוטור',
    'https://distrokid.com/',
    '{
      "short": "DistroKid",
      "color": "text-info",
      "tint": "bg-info/10",
      "ring": "border-info/30",
      "blurb": "הפצה דיגיטלית לספוטיפיי, אפל מיוזיק, יוטיוב מיוזיק, טיקטוק — סטרימינג גלובלי.",
      "relevantSplit": "both"
    }',
    NOW(), 'FlowRoom Team'
  ),
  (
    'youtube-cid', 'body_meta', 'YouTube Content ID',
    'https://studio.youtube.com/',
    '{
      "short": "CID",
      "color": "text-danger",
      "tint": "bg-danger/10",
      "ring": "border-danger/30",
      "blurb": "זיהוי אוטומטי של השיר שלך ביוטיוב — מייצר הכנסה כשאחרים משתמשים בשיר בוידאו.",
      "relevantSplit": "master"
    }',
    NOW(), 'FlowRoom Team'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED — rates row (exchange + streaming minimums)
-- ============================================================

INSERT INTO regulatory_rules (body, kind, label, source_url, content_json, last_verified_at, verified_by)
VALUES (
  'distributor', 'rate', 'שערי המרה ומינימום תשלום',
  'https://help.distrokid.com/',
  '{
    "usd_to_ils": 3.7,
    "min_payout_usd": 10,
    "spotify_per_stream_usd": 0.004,
    "apple_per_stream_usd": 0.007,
    "youtube_music_per_stream_usd": 0.002,
    "note": "שערי קירוב — משתנים מרבעון לרבעון. בדוק מול הדוחות בפועל."
  }',
  NOW(), 'FlowRoom Team'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED — deadline rows
-- ============================================================

INSERT INTO regulatory_rules (body, kind, label, source_url, content_json, last_verified_at, verified_by)
VALUES
  (
    'acum', 'deadline', 'רישום שנתי באקו"ם',
    'https://www.acum.org.il/',
    '{
      "description": "המועד האחרון להגשת יצירות חדשות כדי שיוכרו בחלוקת תמלוגים לשנה זו",
      "due_month": 5,
      "due_day": 31,
      "recurrence": "yearly",
      "note": "בדוק באתר אקו\"ם — המועד עשוי להשתנות"
    }',
    NOW(), 'FlowRoom Team'
  ),
  (
    'pil', 'deadline', 'חלוקת רבעון ראשון — הפיל',
    'https://www.pil.org.il/',
    '{
      "description": "הפיל מחלק תמלוגים 4 פעמים בשנה. רבעון Q1 (ינואר–מרץ) מחולק באפריל–מאי",
      "due_month": 4,
      "due_day": 30,
      "recurrence": "quarterly",
      "note": "לוח הזמנים המדויק — באתר הפיל"
    }',
    NOW(), 'FlowRoom Team'
  )
ON CONFLICT DO NOTHING;
