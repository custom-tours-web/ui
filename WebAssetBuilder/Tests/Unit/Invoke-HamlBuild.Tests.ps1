BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force

    # Define a dummy 'haml' function so Pester can reliably mock it[cite: 13]
    function haml {}
}

Describe 'Invoke-HamlBuild Unit Tests' {

    BeforeEach {
        # Globally mock logging to keep the test console output clean[cite: 13]
        Mock Write-Log {}
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: HAML CLI is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the haml CLI is not found' {
        # Simulate Get-Command failing to find 'haml' in the environment[cite: 13]
        Mock Get-Command { return $null } -ParameterFilter { $Name -eq "haml" }

        { Invoke-HamlBuild -StartPath "C:\FakePath" } | 
            Should -Throw "HAML CLI not found. Install via 'gem install haml'."
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" }
        
        Mock Find-ProjectRoot { return $null }

        { Invoke-HamlBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Source Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        
        Mock Test-Path { return $false }

        { Invoke-HamlBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'HAML source directory not found: C:\FakeProject\src\haml'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: No HAML Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        
        # Simulate finding zero .haml files in the directory[cite: 13]
        Mock Get-ChildItem { return @() }

        { Invoke-HamlBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'No HAML files found in: C:\FakeProject\src\haml'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 5: HAML Compilation Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if haml returns a non-zero exit code' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        Mock New-Item {}
        Mock Set-Content {} # Mock Set-Content so we don't accidentally create files[cite: 13]
        
        $fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\src\haml\index.haml"; Name = "index.haml" }
        Mock Get-ChildItem { return @($fakeFile) }

        # Intercept the 'haml' call and force it to return an error code[cite: 13]
        Mock haml { $global:LASTEXITCODE = 1; return "Syntax Error" }

        { Invoke-HamlBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'HAML compilation failed for*'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 6: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully and compile files without throwing' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        Mock New-Item {}
        Mock Set-Content {} # Ensure file system remains untouched[cite: 13]
        
        $fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\src\haml\index.haml"; Name = "index.haml" }
        Mock Get-ChildItem { return @($fakeFile) }

        # Intercept the 'haml' call and simulate a successful exit code[cite: 13]
        Mock haml { $global:LASTEXITCODE = 0; return "<h1>Hello</h1>" }

        # The function should complete without throwing any exceptions[cite: 13]
        { Invoke-HamlBuild -StartPath "C:\FakePath" } | Should -Not -Throw
    }
}