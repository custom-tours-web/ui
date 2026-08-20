BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force

    function stylus {} 

    InModuleScope 'WebAssetBuilder' {
        function stylus {}
    }
}

Describe 'Invoke-StylusBuild Unit Tests' {

    BeforeEach {
        # Globally mock logging inside the module to keep the test console output clean
        Mock Write-Log {} -ModuleName 'WebAssetBuilder'

        # Set up cross-platform friendly fake paths using TestDrive
        $fakePath    = Join-Path $TestDrive "FakePath"
        $fakeProject = Join-Path $TestDrive "FakeProject"
        $fakeSrcDir  = Join-Path $fakeProject "src/styl"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" } -ModuleName 'WebAssetBuilder'
        
        # Simulate the helper function failing to locate a root
        Mock Find-ProjectRoot { return $null } -ModuleName 'WebAssetBuilder'

        { Invoke-StylusBuild -StartPath $fakePath } | 
            Should-Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Source Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" } -ModuleName 'WebAssetBuilder'
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        
        # Simulate the source directory missing from the file system
        Mock Test-Path { return $false } -ModuleName 'WebAssetBuilder'

        { Invoke-StylusBuild -StartPath $fakePath } | 
            Should-Throw "Stylus source directory not found: $fakeSrcDir"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: No Stylus Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" } -ModuleName 'WebAssetBuilder'
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        Mock Test-Path { return $true } -ModuleName 'WebAssetBuilder'
        
        # Simulate finding zero .styl files in the directory
        Mock Get-ChildItem { return @() } -ModuleName 'WebAssetBuilder'

        { Invoke-StylusBuild -StartPath $fakePath } | 
            Should-Throw "No Stylus files found in: $fakeSrcDir"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully and compile files without throwing' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "stylus" } -ModuleName 'WebAssetBuilder'
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        Mock Test-Path { return $true } -ModuleName 'WebAssetBuilder'
        Mock New-Item {} -ModuleName 'WebAssetBuilder'
        
        $fakeFile = [PSCustomObject]@{ FullName = (Join-Path $fakeSrcDir "app.styl") }
        Mock Get-ChildItem { return @($fakeFile) } -ModuleName 'WebAssetBuilder'

        # Intercept the 'stylus' call and simulate a successful exit code
        Mock stylus { $global:LASTEXITCODE = 0 } -ModuleName 'WebAssetBuilder'

        # The function should complete without throwing any exceptions
        Invoke-StylusBuild -StartPath $fakePath
    }
}