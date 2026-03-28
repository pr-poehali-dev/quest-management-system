
CREATE TABLE IF NOT EXISTS mp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES mp_users(id),
  integration_key TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mp_sites(id),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES mp_paths(id),
  title TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  riddle_type TEXT DEFAULT 'text',
  riddle_content TEXT,
  riddle_file_url TEXT,
  answer TEXT NOT NULL,
  hint TEXT,
  hint_penalty INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_site_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mp_sites(id),
  user_id UUID REFERENCES mp_users(id),
  role TEXT DEFAULT 'member_1',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, user_id)
);

CREATE TABLE IF NOT EXISTS mp_path_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES mp_paths(id),
  user_id UUID REFERENCES mp_users(id),
  access_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES mp_users(id),
  UNIQUE(path_id, user_id)
);

CREATE TABLE IF NOT EXISTS mp_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES mp_users(id),
  level_id UUID REFERENCES mp_levels(id),
  path_id UUID REFERENCES mp_paths(id),
  completed BOOLEAN DEFAULT false,
  used_hint BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 100,
  completed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  UNIQUE(user_id, level_id)
);

CREATE TABLE IF NOT EXISTS mp_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mp_sites(id),
  user_id UUID REFERENCES mp_users(id),
  path_id UUID REFERENCES mp_paths(id),
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES mp_users(id)
);

CREATE TABLE IF NOT EXISTS mp_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mp_sites(id),
  invited_by UUID REFERENCES mp_users(id),
  contact TEXT NOT NULL,
  contact_type TEXT DEFAULT 'email',
  invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  role TEXT DEFAULT 'member_1',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE TABLE IF NOT EXISTS mp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mp_sites(id),
  sender_id UUID REFERENCES mp_users(id),
  recipient_id UUID REFERENCES mp_users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES mp_users(id),
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_mp_sessions_token ON mp_sessions(token);
CREATE INDEX IF NOT EXISTS idx_mp_progress_user ON mp_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mp_site_members_site ON mp_site_members(site_id);
CREATE INDEX IF NOT EXISTS idx_mp_levels_path ON mp_levels(path_id);
CREATE INDEX IF NOT EXISTS idx_mp_path_access_token ON mp_path_access(access_token);
