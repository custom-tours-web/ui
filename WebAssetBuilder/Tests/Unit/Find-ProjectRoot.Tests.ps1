BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

# Step inside the module's scope to access private/internal functions
InModuleScope 'WebAssetBuilder' {

    Describe 'Find-ProjectRoot Unit Tests' {

        BeforeEach {
            # Mock Write-Log to prevent console spam
            Mock Write-Log {}

            # Set up a temporary nested directory structure using Pester's TestDrive
            # Structure: TestDrive/MyProject/src/components/ui
            $projectRoot = Join-Path $TestDrive "MyProject"
            $srcDir      = Join-Path $projectRoot "src"
            $nestedDir   = Join-Path $srcDir "components/ui"

            # Create the deeply nested directory
            New-Item -ItemType Directory -Path $nestedDir -Force | Out-Null
        }

        AfterEach {
            # Wipe the TestDrive clean between EVERY 'It' block to prevent file leakage
            Get-ChildItem -Path $TestDrive -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        }

        # Invalid Starting Path
        It 'Should return $null if the StartPath does not exist' {
            $invalidPath = Join-Path $TestDrive "DoesNotExist"

            $result = Find-ProjectRoot -StartPath $invalidPath
            $result | Should-BeNull
        }

        # Starting at the Root
        It 'Should return the exact directory when starting directly in the project root' {
            $result = Find-ProjectRoot -StartPath $projectRoot
            $result | Should-Be $projectRoot
        }

        # Recursive Traversal (The Core Logic)
        It 'Should traverse upward & find the project root when starting in a deeply nested folder' {
            $result = Find-ProjectRoot -StartPath $nestedDir
            $result | Should-Be $projectRoot
        }

        # Missing 'src' Directory
        It 'Should return $null if it traverses to the filesystem root without finding a src folder' {
            $noSrcDir = Join-Path $TestDrive "OtherFolder/Deep"
            New-Item -ItemType Directory -Path $noSrcDir -Force | Out-Null

            $result = Find-ProjectRoot -StartPath $noSrcDir
            $result | Should-BeNull
        }
    }
}
