BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

Describe 'Invoke-WebAssetsValidation Unit Tests' {

    BeforeEach {
        # Mock Write-Log globally to keep the test console clean[cite: 16]
        Mock Write-Log {}
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        # Simulate Find-ProjectRoot failing to locate the root[cite: 16]
        Mock Find-ProjectRoot { return $null }

        { Invoke-WebAssetsValidation -StartPath "C:\FakePath" } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Dist Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the dist directory does not exist' {
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        
        # Simulate the 'dist' directory missing from the file system[cite: 16]
        Mock Test-Path { return $false }

        { Invoke-WebAssetsValidation -StartPath "C:\FakePath" } | 
            Should -Throw 'Final dist directory was not created: C:\FakeProject\dist'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Missing Specific File Types
    # ----------------------------------------------------------------------
    Context 'When the dist directory exists but lacks specific files' {
        
        BeforeEach {
            Mock Find-ProjectRoot { return "C:\FakeProject" }
            Mock Test-Path { return $true }
            
            # Setup dummy objects with a FullName property to satisfy the final logging loop[cite: 16]
            $script:fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\dist\fake.file" }
        }

        It 'Should throw an error if no HTML files are found' {
            # Return empty for HTML, but return fake files for CSS and JS[cite: 16]
            Mock Get-ChildItem { return @() } -ParameterFilter { $Filter -eq '*.html' }
            Mock Get-ChildItem { return @($script:fakeFile) } -ParameterFilter { $Filter -eq '*.css' }
            Mock Get-ChildItem { return @($script:fakeFile) } -ParameterFilter { $Filter -eq '*.js' }

            { Invoke-WebAssetsValidation -StartPath "C:\FakePath" } | 
                Should -Throw 'No HTML files found in final dist.'
        }

        It 'Should throw an error if no CSS files are found' {
            Mock Get-ChildItem { return @($script:fakeFile) } -ParameterFilter { $Filter -eq '*.html' }
            Mock Get-ChildItem { return @() } -ParameterFilter { $Filter -eq '*.css' }
            Mock Get-ChildItem { return @($script:fakeFile) } -ParameterFilter { $Filter -eq '*.js' }

            { Invoke-WebAssetsValidation -StartPath "C:\FakePath" } | 
                Should -Throw 'No CSS files found in final dist.'
        }

        It 'Should throw an error if no JS files are found' {
            Mock Get-ChildItem { return @($script:fakeFile) } -ParameterFilter { $Filter -eq '*.html' }
            Mock Get-ChildItem { return @($script:fakeFile) } -ParameterFilter { $Filter -eq '*.css' }
            Mock Get-ChildItem { return @() } -ParameterFilter { $Filter -eq '*.js' }

            { Invoke-WebAssetsValidation -StartPath "C:\FakePath" } | 
                Should -Throw 'No JavaScript files found in final dist.'
        }
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully without throwing when all files are present' {
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        
        # Create dummy objects to satisfy the .Count checks and .FullName logging[cite: 16]
        $dummyHtml = [PSCustomObject]@{ FullName = "C:\FakeProject\dist\index.html" }
        $dummyCss  = [PSCustomObject]@{ FullName = "C:\FakeProject\dist\style.css" }
        $dummyJs   = [PSCustomObject]@{ FullName = "C:\FakeProject\dist\app.js" }

        # Mock the specific filtered calls[cite: 16]
        Mock Get-ChildItem { return @($dummyHtml) } -ParameterFilter { $Filter -eq '*.html' }
        Mock Get-ChildItem { return @($dummyCss) } -ParameterFilter { $Filter -eq '*.css' }
        Mock Get-ChildItem { return @($dummyJs) } -ParameterFilter { $Filter -eq '*.js' }
        
        # Mock the final unfiltered call used for logging all paths[cite: 16]
        Mock Get-ChildItem { return @($dummyHtml, $dummyCss, $dummyJs) } -ParameterFilter { $null -eq $Filter }

        # The function should complete without throwing any exceptions[cite: 16]
        { Invoke-WebAssetsValidation -StartPath "C:\FakePath" } | Should -Not -Throw
    }
}