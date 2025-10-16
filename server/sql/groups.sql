-- Groups table structure
-- This table stores groups information

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Groups' AND xtype='U')
BEGIN
    CREATE TABLE [NTURobot].[dbo].[Groups] (
        [ID] INT IDENTITY(1,1) PRIMARY KEY,
        [groupName] NVARCHAR(100) NOT NULL,
        
        -- Unique constraint to prevent duplicate group names
        CONSTRAINT [UQ_Groups_GroupName] UNIQUE ([groupName])
    );
    
    -- Create indexes for better performance
    CREATE INDEX [IX_Groups_GroupName] ON [Groups]([groupName]);
    
    PRINT 'Groups table created successfully';
END
ELSE
BEGIN
    PRINT 'Groups table already exists';
END

-- Insert some default groups if table is empty
IF NOT EXISTS (SELECT TOP 1 1 FROM [Groups])
BEGIN
    INSERT INTO [Groups] ([groupName]) VALUES 
        ('Administrators'),
        ('Operators'),
        ('Viewers'),
        ('Guests'),
        ('Managers'),
        ('Technicians'),
        ('Supervisors'),
        ('Maintenance'),
        ('Security'),
        ('Quality Control'),
        ('Production'),
        ('Logistics');
    
    PRINT 'Default groups inserted successfully';
END
ELSE
BEGIN
    PRINT 'Groups table already contains data';
END
