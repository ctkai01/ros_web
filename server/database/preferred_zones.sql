-- Create Preferred table for preferred zones
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Preferred' AND xtype='U')
BEGIN
    CREATE TABLE Preferred (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        IDMap INT NOT NULL,
        PreferredName NVARCHAR(255) NOT NULL,
        Properties NVARCHAR(MAX),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (IDMap) REFERENCES maps(ID) ON DELETE CASCADE
    );
    
    PRINT 'Preferred table created successfully';
END
ELSE
BEGIN
    PRINT 'Preferred table already exists';
END

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Preferred_IDMap')
BEGIN
    CREATE INDEX IX_Preferred_IDMap ON Preferred(IDMap);
    PRINT 'Index IX_Preferred_IDMap created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_Preferred_IDMap already exists';
END
