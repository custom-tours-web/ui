BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force

    # Define a dummy 'stylus' function so Pester can reliably mock it[cite: 12]
    function stylus {}
}

Describe 'Invoke-StylusBuild Unit Tests' {

    BeforeEach {
        # Globally mock logging to keep the test console output clean[cite: 12]
        Mock Write-Log {}
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: Stylus CLI is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the stylus CLI is not found' {
        # Simulate Get-Command failing to find 'stylus' in the environment[cite: 12]
        Mock Get-Command { return $null } -ParameterFilter { $Name -eq "stylus" }

        { Invoke-StylusBuild -StartPath "C:\FakePath" } | 
            Should -Throw "Stylus CLI not found. Install via 'npm install -g stylus'."
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" }
        
        # Simulate the helper function failing to locate a root[cite: 12]
        Mock Find-ProjectRoot { return $null }

        { Invoke-StylusBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Source Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        
        # Simulate the 'src/styl' directory missing from the file system[cite: 12]
        Mock Test-Path { return $false }

        { Invoke-StylusBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'Stylus source directory not found: C:\FakeProject\src\styl'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: No Stylus Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        
        # Simulate finding zero .styl files in the directory[cite: 12]
        Mock Get-ChildItem { return @() }

        { Invoke-StylusBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'No Stylus files found in: C:\FakeProject\src\styl'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 5: Stylus Compilation Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if stylus returns a non-zero exit code' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        Mock New-Item {}
        
        # Provide a fake file to bypass the empty directory check[cite: 12]
        $fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\src\styl\app.styl" }
        Mock Get-ChildItem { return @($fakeFile) }

        # Intercept the 'stylus' call and force it to return an error code[cite: 12]
        Mock stylus { $global:LASTEXITCODE = 1 }

        { Invoke-StylusBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'Stylus compilation failed for*'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 6: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully and compile files without throwing' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        Mock New-Item {}
        
        $fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\src\styl\app.styl" }
        Mock Get-ChildItem { return @($fakeFile) }

        # Intercept the 'stylus' call and simulate a successful exit code[cite: 12]
        Mock stylus { $global:LASTEXITCODE = 0 }

        # The function should complete without throwing any exceptions[cite: 12]
        { Invoke-StylusBuild -StartPath "C:\FakePath" } | Should -Not -Throw
    }
}