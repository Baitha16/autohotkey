#SingleInstance Force
#Persistent
#NoEnv
SendMode Input
SetWorkingDir %A_ScriptDir%
FileEncoding, UTF-8

; ============= MEMBERSHIP API =============
; >>> Wajib ganti ke HTTPS untuk production! <<<
; Development:
BASE_URL := "http://localhost:3000/api"
; Production example:
; BASE_URL := "https://your-project.vercel.app/api"

HttpPost(url, payload) {
    http := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    http.Open("POST", url, false)
    http.SetRequestHeader("Content-Type", "application/json")
    http.Send(payload)
    return http.ResponseText
}

Jsons(str) {
    obj := {}
    try {
        doc := ComObjCreate("HTMLfile")
        doc.write("<script>document.json=" . str . "</script>")
        val := doc.json
        if IsObject(val)
            obj := val
    } catch {
        pos := 1
        while (pos := RegExMatch(str, """([^""]+)"":\s*(""([^""]*)""|true|false|null|[\d.]+)", m, pos + StrLen(m))) {
            k := m1
            v := m2
            if (SubStr(v, 1, 1) = """")
                v := SubStr(v, 2, -1)
            else if (v = "true")
                v := true
            else if (v = "false")
                v := false
            obj[k] := v
        }
    }
    return obj
}

FmtDate(iso) {
    if !iso
        return "N/A"
    y := SubStr(iso, 1, 4)
    m := SubStr(iso, 6, 2)
    d := SubStr(iso, 9, 2)
    h := SubStr(iso, 12, 2)
    i := SubStr(iso, 15, 2)
    return d "/" m "/" y " " h ":" i
}

Login(licenseCode) {
    global BASE_URL
    url := BASE_URL . "/verify-license"
    payload := "{""license_code"": """ . licenseCode . """}"
    return Jsons(HttpPost(url, payload))
}
; ============= END MEMBERSHIP API =============

; ============= LOGIN GUI =============
Gui, New, , License Login
Gui, Font, s10, Segoe UI
Gui, Add, Text, , Enter your license code:
Gui, Add, Edit, w280 vLicenseInput gLicenseKeyCheck
Gui, Add, Button, w280 gDoLoginDefault, Login
Gui, Add, Text, w280 vLoginStatus cRed
Gui, Show, w320 h120, License Login
return

LicenseKeyCheck:
    Gui, Submit, Nohide
    if (RegExMatch(LicenseInput, "^(VIP|TRIAL)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$") || RegExMatch(LicenseInput, "^EZ-\d{9,15}(-[A-Z0-9]{4}-[A-Z0-9]{4})?$")) {
        GuiControl,, LoginStatus
    } else {
        GuiControl,, LoginStatus, Invalid format (VIP/TRIAL-XXXX-XXXX-XXXX / EZ-[phone])
    }
return

DoLoginDefault:
    GoSub DoLogin
return

DoLogin:
    Gui, Submit, Nohide
    Gui, +OwnDialogs
    if !RegExMatch(LicenseInput, "^(VIP|TRIAL)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$") && !RegExMatch(LicenseInput, "^EZ-\d{9,15}(-[A-Z0-9]{4}-[A-Z0-9]{4})?$") {
        MsgBox, Invalid license code format.
        return
    }
    Gui, Submit, Nohide
    result := Login(LicenseInput)
    if (result.success) {
        gLicenseCode := LicenseInput
        gMembershipType := result.membership_type
        gExpiresAt := result.expires_at
        expiryDisplay := FmtDate(gExpiresAt)
        if (gMembershipType = "lifetime")
            expiryDisplay := "Never"
        MsgBox, 64, Login Successful, Welcome!`nMembership: %gMembershipType%`nExpires: %expiryDisplay%
        Gui, Destroy
        GoSub MainGui
    } else {
        GuiControl,, LoginStatus, % "Error: " . result.error
    }
return

MainGui:
masked := gLicenseCode
if RegExMatch(gLicenseCode, "^EZ-\d{9,15}$")
    masked := "EZ-XXXX"
else if RegExMatch(gLicenseCode, "^EZ-\d{9,15}-[A-Z0-9]{4}-[A-Z0-9]{4}$")
    masked := SubStr(gLicenseCode, 1, 3) . "XXXX-XXXX-XXXX"
else
    masked := SubStr(gLicenseCode, 1, 4) . "-XXXX-XXXX-" . SubStr(gLicenseCode, -4)
Gui, New, +AlwaysOnTop +Resize +MinSize400x460

; === Dashboard Bar ===
Gui, Font, s8, Segoe UI
Gui, Add, Text, x10 y8 cGreen, [%gMembershipType%]
Gui, Add, Text, x110 y8, License: %masked%
expiryDisplay := FmtDate(gExpiresAt)
if (gMembershipType = "lifetime")
    expiryDisplay := "Never"
Gui, Add, Text, x320 y8, Expires: %expiryDisplay%

; === Title ===
Gui, Add, Text, cBlue Center w620 x10 y28, Roblox Virtual Piano Autoplayer by Ezio

; === Transpose ===
Gui, Add, Text, x20 y55, Transpose:
Gui, Add, Edit, x100 y52 w30 vTransposeValue, 0
Gui, Add, Text, x140 y55 w300 vFileName cBlack, [No file loaded]

; === Hint ===
Gui, Add, Text, x20 y75 cRed, Match this Transpose to the Virtual Piano in Roblox

; === Sheet ===
Gui, Add, Text, x20 y105, Piano Sheet:
Gui, Add, Edit, x20 y125 w280 h190 vPianoMusic gSheetChanged -Wrap WantTab VScroll

; === Lyrics ===
Gui, Add, Text, x320 y105, Lyrics:
Gui, Add, Edit, x320 y125 w280 h190 vLyrics -Wrap WantTab VScroll

; === Progress ===
Gui, Add, Text, x20 y330, Progress:
Gui, Add, Edit, ReadOnly x20 y350 w580 h60 vNextNotes

; === Progress Bar ===
Gui, Add, Progress, x20 y420 w580 h20 BackgroundFFFFFF cGreen vProgressBar

; === Tempo ===
Gui, Add, Checkbox, x20 y450 vAutoMode, Auto Tempo
Gui, Add, Slider, x120 y447 w150 vTempoValue Range10-500 TickInterval50 ToolTip, 120

; === How to use ===
Gui, Add, Text, x20 y480, How to use:
Gui, Add, Text, x40 y500, Auto: Check box and adjust Tempo, press F5 to Play/Stop
Gui, Add, Text, x40 y520, Manual: Press arrow keys to play with rhythm

; === Buttons ===
btnY := 550
btnW := 85
btnH := 28
gap := 15
btnX := 20

Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% vTogglePlayStopButton gTogglePlayStop, Play
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gReset, Reset
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gClearAll, Clear
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gSaveSheet, Save
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gLoadSheet, Load
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gGuiClose, Exit

Gui, Show, w680 h610, Roblox Virtual Piano Autoplayer

; ============= VARIABLES =============
PianoMusic := ""
Lyrics := ""
TransposeValue := 0
TempoValue := 120
CurrentPos := 1
DisplayPos := 1
KeyDelay := 120
isPlaying := false
LoadedFile := ""

; ============= FUNCTIONS =============
PlayNextNote() {
    global PianoMusic, CurrentPos, DisplayPos, KeyDelay, isPlaying

    if (!isPlaying)
        return

    Gui, Submit, Nohide
    DisplayMusic := PianoMusic
    PianoMusic := RegExReplace(PianoMusic, "`r|`n|/| |-|,|\.")

    totalLen := StrLen(PianoMusic)
    if (totalLen = 0)
        return

    if (CurrentPos > totalLen)
        return

    if (CurrentPos <= totalLen) {
        if (RegExMatch(PianoMusic, "U)(\[.*]|.)", Keys, CurrentPos)) {
            CurrentPos += StrLen(Keys)

            while (DisplayPos <= StrLen(DisplayMusic) && InStr(" `n`r/-,.", SubStr(DisplayMusic, DisplayPos, 1)))
                DisplayPos++

            DisplayPos += StrLen(Keys)

            Keys := Trim(Keys, "[]")
            SendInput, {Raw}%Keys%

            NextNotes := SubStr(RegExReplace(DisplayMusic, "-|,|\."), DisplayPos, 150)
            GuiControl,, NextNotes, %NextNotes%

            progressValue := (CurrentPos * 100) // totalLen
            GuiControl,, ProgressBar, %progressValue%

            Sleep, %KeyDelay%
        }
    }
}

AutoPlay() {
    global isPlaying, KeyDelay
    While (isPlaying) {
        PlayNextNote()
        Sleep, %KeyDelay%
    }
}

$Left::PlayNextNote()
$Right::PlayNextNote()
$Up::PlayNextNote()
$Down::PlayNextNote()

$F5::
    GoSub, TogglePlayStop
return

TogglePlayStop:
    Gui, Submit, Nohide
    if (!isPlaying) {
        isPlaying := true
        GuiControl,, TogglePlayStopButton, Pause
        if (AutoMode) {
            KeyDelay := TempoValue
            SetTimer, AutoPlay, 10
        }
    } else {
        isPlaying := false
        GuiControl,, TogglePlayStopButton, Play
        SetTimer, AutoPlay, Off
    }
return

Reset:
    CurrentPos := 1
    DisplayPos := 1
    GuiControl,, NextNotes
    GuiControl,, ProgressBar, 0
return

ClearAll:
    PianoMusic := ""
    Lyrics := ""
    TransposeValue := 0
    TempoValue := 120
    GuiControl,, PianoMusic
    GuiControl,, Lyrics
    GuiControl,, TransposeValue, 0
    GuiControl,, TempoValue, 120
    GuiControl,, NextNotes
    GuiControl,, ProgressBar, 0
    GuiControl,, FileName, [No file loaded]
return

SaveSheet:
    Gui, Submit, Nohide
    if (TransposeValue < -24)
        TransposeValue := -24
    if (TransposeValue > 24)
        TransposeValue := 24
    FileSelectFile, savePath, S16, , Save Piano Sheet, Text Documents (*.txt)
    if (savePath != "") {
        if !InStr(savePath, ".txt")
            savePath .= ".txt"
        PianoMusic := RegExReplace(PianoMusic, "-|,|\.")
        content := "[Transpose]" . TransposeValue . "`n[Tempo]" . TempoValue . "`n[Sheet]`n" . Trim(PianoMusic, "`r`n ") . "`n[Lyrics]`n" . Trim(Lyrics, "`r`n ")
        FileDelete, %savePath%
        FileAppend, %content%, %savePath%
        LoadedFile := savePath
        SplitPath, savePath, fileNameOnly
        GuiControl,, FileName, %fileNameOnly%
    }
return

LoadSheet:
    FileSelectFile, loadPath, 3, , Load Piano Sheet, Text Documents (*.txt)
    if (loadPath != "") {
        FileRead, fileContent, %loadPath%
        TransposeValue := RegExReplace(fileContent, "s).*\[Transpose\](-?\d+).*", "$1")
        TempoValue := RegExReplace(fileContent, "s).*\[Tempo\](\d+).*", "$1")
        if (TransposeValue < -24)
            TransposeValue := -24
        if (TransposeValue > 24)
            TransposeValue := 24
        if (TempoValue < 10)
            TempoValue := 10
        PianoMusic := RegExReplace(fileContent, "s).*\[Sheet\](.*?)\[Lyrics\].*", "$1")
        Lyrics := RegExReplace(fileContent, "s).*\[Lyrics\](.*)", "$1")
        PianoMusic := RegExReplace(PianoMusic, "-|,|\.")
        PianoMusic := Trim(PianoMusic, "`r`n ")
        Lyrics := Trim(Lyrics, "`r`n ")

        GuiControl,, PianoMusic, %PianoMusic%
        GuiControl,, Lyrics, %Lyrics%
        GuiControl,, TransposeValue, %TransposeValue%
        GuiControl,, TempoValue, %TempoValue%

        CurrentPos := 1
        DisplayPos := 1
        GuiControl,, NextNotes
        GuiControl,, ProgressBar, 0

        LoadedFile := loadPath
        SplitPath, loadPath, fileNameOnly
        GuiControl,, FileName, %fileNameOnly%
    }
return

SheetChanged:
    Gui, Submit, Nohide
    PianoMusic := RegExReplace(PianoMusic, "-|,|\.")
    GuiControl,, PianoMusic, %PianoMusic%
return

GuiClose:
    ExitApp
