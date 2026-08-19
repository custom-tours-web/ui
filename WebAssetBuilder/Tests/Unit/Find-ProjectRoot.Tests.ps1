BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

Describe 'Find-ProjectRoot Unit Tests' {
    
    BeforeEach {
        # Mock Write-Log so we don't spam the console during testing
        Mock Write-Log {}

        # Set up a temporary nested directory structure
        # Structure: TempDrive/MyProject/src/components/ui
        $script:tempDrive   = Join-Path ([System.IO.Path]::GetTempPath()) "WAB_UT_$(New-Guid)"
        $script:projectRoot = Join-Path $script:tempDrive "MyProject"
        $script:srcDir      = Join-Path $script:projectRoot "src"
        $script:nestedDir   = Join-Path $script:srcDir "components\ui"

        # Create the deeply nested directory (which creates all parent folders automatically)
        New-Item -ItemType Directory -Path $script:nestedDir -Force | Out-Null
    }

    AfterEach {
        # Clean up the temporary directories
        if (Test-Path $script:tempDrive) {
            Remove-Item -Path $script:tempDrive -Recurse -Force
        }
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: Invalid Starting Path
    # ----------------------------------------------------------------------
    It 'Should return $null if the StartPath does not exist' {
        $invalidPath = Join-Path $script:tempDrive "DoesNotExist"
        
        # Validates the catch block returns $null when DirectoryNotFoundException is thrown
        $result = Find-ProjectRoot -StartPath $invalidPath
        $result | Should -BeNullOrEmpty
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Starting at the Root
    # ----------------------------------------------------------------------
    It 'Should return the exact directory when starting directly in the project root' {
        $result = Find-ProjectRoot -StartPath $script:projectRoot
        $result | Should -Be $script:projectRoot
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Recursive Traversal (The Core Logic)
    # ----------------------------------------------------------------------
    It 'Should traverse upward and find the project root when starting in a deeply nested folder' {
        $result = Find-ProjectRoot -StartPath $script:nestedDir
        $result | Should -Be $script:projectRoot
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: Missing 'src' Directory
    # ----------------------------------------------------------------------
    It 'Should return $null if it traverses to the filesystem root without finding a src folder' {
        # Create a directory path that has no 'src' folder anywhere in its parent chain
        $script:noSrcDir = Join-Path $script:tempDrive "OtherFolder\Deep"
        New-Item -ItemType Directory -Path $script:noSrcDir -Force | Out-Null

        # Validates the catch block returns $null when the generic Exception is thrown
        $result = Find-ProjectRoot -StartPath $script:noSrcDir
        $result | Should -BeNullOrEmpty
    }
}