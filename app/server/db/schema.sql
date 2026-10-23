-- PotholePal schema (SQL Server 2022). Idempotent: safe to run repeatedly.

IF OBJECT_ID('dbo.users', 'U') IS NULL
CREATE TABLE dbo.users (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(120)  NOT NULL,
    email         NVARCHAR(200)  NOT NULL,
    password_hash NVARCHAR(200)  NOT NULL,
    role          NVARCHAR(20)   NOT NULL CONSTRAINT DF_users_role DEFAULT ('resident'),
    points        INT            NOT NULL CONSTRAINT DF_users_points DEFAULT (0),
    level         INT            NOT NULL CONSTRAINT DF_users_level DEFAULT (1),
    created_at    DATETIME2      NOT NULL CONSTRAINT DF_users_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_users_email UNIQUE (email)
);

IF OBJECT_ID('dbo.reports', 'U') IS NULL
CREATE TABLE dbo.reports (
    id              INT IDENTITY(1018,1) PRIMARY KEY,
    ref             AS ('#' + CAST(id AS NVARCHAR(10))) PERSISTED,
    reporter_id     INT           NOT NULL REFERENCES dbo.users (id),
    lat             DECIMAL(9,6)  NOT NULL,
    lng             DECIMAL(9,6)  NOT NULL,
    address         NVARCHAR(300) NOT NULL,
    area            NVARCHAR(120) NOT NULL,
    issue_type      NVARCHAR(80)  NOT NULL,
    size            NVARCHAR(20)  NOT NULL,
    depth           NVARCHAR(20)  NOT NULL,
    traffic         NVARCHAR(20)  NOT NULL,
    damage          NVARCHAR(10)  NOT NULL,
    description     NVARCHAR(1000) NOT NULL CONSTRAINT DF_reports_desc DEFAULT (''),
    status          NVARCHAR(20)  NOT NULL CONSTRAINT DF_reports_status DEFAULT ('new'),
    priority        NVARCHAR(4)   NOT NULL,
    score           TINYINT       NOT NULL,
    duplicate_count INT           NOT NULL CONSTRAINT DF_reports_dup DEFAULT (0),
    photo_url       NVARCHAR(400) NULL,
    evidence_url    NVARCHAR(400) NULL,
    -- Proof-of-repair photo the crew takes when they close the report.
    fixed_photo_url NVARCHAR(400) NULL,
    created_at      DATETIME2     NOT NULL CONSTRAINT DF_reports_created DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2     NOT NULL CONSTRAINT DF_reports_updated DEFAULT (SYSUTCDATETIME()),
    scheduled_at    DATETIME2     NULL,
    fixed_at        DATETIME2     NULL
);

-- Databases created before the repair-photo feature get the column here.
IF COL_LENGTH('dbo.reports', 'fixed_photo_url') IS NULL
    ALTER TABLE dbo.reports ADD fixed_photo_url NVARCHAR(400) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_reports_ref' AND object_id = OBJECT_ID('dbo.reports'))
    CREATE UNIQUE INDEX UQ_reports_ref ON dbo.reports (ref);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_reports_status' AND object_id = OBJECT_ID('dbo.reports'))
    CREATE INDEX IX_reports_status ON dbo.reports (status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_reports_latlng' AND object_id = OBJECT_ID('dbo.reports'))
    CREATE INDEX IX_reports_latlng ON dbo.reports (lat, lng);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_reports_reporter' AND object_id = OBJECT_ID('dbo.reports'))
    CREATE INDEX IX_reports_reporter ON dbo.reports (reporter_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_reports_created' AND object_id = OBJECT_ID('dbo.reports'))
    CREATE INDEX IX_reports_created ON dbo.reports (created_at DESC);

IF OBJECT_ID('dbo.report_status_history', 'U') IS NULL
CREATE TABLE dbo.report_status_history (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    report_id  INT           NOT NULL REFERENCES dbo.reports (id),
    status     NVARCHAR(20)  NOT NULL,
    note       NVARCHAR(500) NULL,
    changed_by INT           NULL REFERENCES dbo.users (id),
    created_at DATETIME2     NOT NULL CONSTRAINT DF_hist_created DEFAULT (SYSUTCDATETIME())
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_history_report' AND object_id = OBJECT_ID('dbo.report_status_history'))
    CREATE INDEX IX_history_report ON dbo.report_status_history (report_id, created_at);

IF OBJECT_ID('dbo.notifications', 'U') IS NULL
CREATE TABLE dbo.notifications (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT           NOT NULL REFERENCES dbo.users (id),
    report_id  INT           NULL REFERENCES dbo.reports (id),
    type       NVARCHAR(30)  NOT NULL,
    title      NVARCHAR(200) NOT NULL,
    body       NVARCHAR(500) NOT NULL,
    is_read    BIT           NOT NULL CONSTRAINT DF_notif_read DEFAULT (0),
    created_at DATETIME2     NOT NULL CONSTRAINT DF_notif_created DEFAULT (SYSUTCDATETIME())
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_notifications_user' AND object_id = OBJECT_ID('dbo.notifications'))
    CREATE INDEX IX_notifications_user ON dbo.notifications (user_id, created_at DESC);

-- Field teams (Team A - Team H): accounts live in dbo.users with role 'team',
-- and this table carries each team's live assignment state for the portals.
IF OBJECT_ID('dbo.teams', 'U') IS NULL
CREATE TABLE dbo.teams (
    user_id    INT PRIMARY KEY REFERENCES dbo.users (id),
    status     NVARCHAR(20) NOT NULL CONSTRAINT DF_teams_status DEFAULT ('available'),
    report_id  INT NULL REFERENCES dbo.reports (id),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_teams_updated DEFAULT (SYSUTCDATETIME())
);

-- One active password-reset code per user (see /api/v1/auth/forgot).
IF OBJECT_ID('dbo.password_resets', 'U') IS NULL
CREATE TABLE dbo.password_resets (
    user_id    INT           PRIMARY KEY REFERENCES dbo.users (id),
    code_hash  NVARCHAR(200) NOT NULL,
    expires_at DATETIME2     NOT NULL,
    created_at DATETIME2     NOT NULL CONSTRAINT DF_resets_created DEFAULT (SYSUTCDATETIME())
);
