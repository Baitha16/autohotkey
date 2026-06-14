#SingleInstance Force
#Persistent
#NoEnv
SendMode Input
SetWorkingDir %A_ScriptDir%
FileEncoding, UTF-8

; ============= MEMBERSHIP API =============
; Production:
BASE_URL := "https://autohokey-backend.vercel.app/api"
; Development (local):
; BASE_URL := "http://localhost:3000/api"

HttpPost(url, payload) {
    try {
        http := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        http.Open("POST", url, false)
        http.SetRequestHeader("Content-Type", "application/json")
        http.Send(payload)
        return http.ResponseText
    } catch e {
        return "{""success"": false, ""error"": ""Connection failed: " . e.Message . """}"
    }
}

Jsons(str) {
    obj := {}
    try {
        doc := ComObjCreate("HTMLfile")
        doc.write("<script>document.charset='UTF-8';</script>")
        doc.write("<body>" . str . "</body>")
        body := doc.body
        if IsObject(body) {
            txt := body.innerText
            if txt
                return {success: false, error: txt}
        }
    }
    try {
        obj := StrSplit(str, """success"":")
        if obj.MaxIndex() >= 2 {
            part := StrSplit(obj[2], ",")
            first := Trim(part[1])
            if (first = "false") {
                errPart := RegExMatch(str, """error"":\s*""([^""]+)", m)
                return {success: false, error: m1}
            }
            if (first = "true") {
                mt := RegExMatch(str, """membership_type"":\s*""([^""]+)", m1) ? m1 : ""
                ea := RegExMatch(str, """expires_at"":\s*""([^""]+)", m2) ? m2 : ""
                ow := RegExMatch(str, """owner"":\s*""([^""]+)", m3) ? m3 : ""
                return {success: true, membership_type: mt, expires_at: ea, owner: ow}
            }
        }
    }
    return {success: false, error: "Parse failed"}
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
        gOwner := result.owner
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

FmtDate(iso) {
    if !iso
        return "N/A"
    s := iso
    StringReplace, s, s, T, , All
    StringReplace, s, s, Z, , All
    StringReplace, s, s, -, , All
    StringReplace, s, s, :, , All
    s := SubStr(s, 1, 14)
    utcNow := A_NowUTC
    locNow := A_Now
    EnvSub, locNow, %utcNow%, Seconds
    offset := locNow
    s += offset, Seconds
    FormatTime, out, %s%, dd/MM/yyyy HH:mm
    return out
}

; ============= MAIN GUI (PIANO) =============
MainGui:
Gui, New, +AlwaysOnTop +Resize +MinSize400x400
Gui, Font, s9, Segoe UI Emoji

; === Dashboard Bar ===
Gui, Font, s8, Segoe UI
gMembershipLabel := "[" . gMembershipType . "]"
Gui, Add, Text, x10 y8 cGreen, %gMembershipLabel%
licenseY := 8
if (gOwner) {
    Gui, Add, Text, x110 y8, Owner: %gOwner%
    licenseY := 22
}
masked := gLicenseCode
if RegExMatch(gLicenseCode, "^EZ-\d{9,15}$")
    masked := "EZ-XXXX"
else if RegExMatch(gLicenseCode, "^EZ-\d{9,15}-[A-Z0-9]{4}-[A-Z0-9]{4}$")
    masked := SubStr(gLicenseCode, 1, 3) . "XXXX-XXXX-XXXX"
else
    masked := SubStr(gLicenseCode, 1, 4) . "-XXXX-XXXX-" . SubStr(gLicenseCode, -4)
Gui, Add, Text, x110 y%licenseY%, License: %masked%
if (gMembershipType = "lifetime")
    expiryDisplay := "Never"
Gui, Add, Text, x320 y%licenseY%, Expires: %expiryDisplay%

; === Title ===
Gui, Font, s9, Segoe UI Emoji
Gui, Add, Text, cBlue Center w620 x10 y28, 🎶 Roblox Virtual Piano Autoplayer by Ezio 🎶

; === Auto-logout when expired/suspended ===
SetTimer, CheckLicense, 60000
gosub CheckLicense

; === Transpose ===
Gui, Add, Text, x20 y55, ⚡ Transpose:
Gui, Add, Edit, x100 y52 w30 vTransposeValue, 0
Gui, Add, Text, x140 y55 w300 vFileName cBlack, 📁 [No file loaded]

; === Hint ===
Gui, Add, Text, x20 y75 cRed, Match this Transpose to the Virtual Piano in Roblox

; === Sheet Piano (kiri) ===
Gui, Add, Text, x20 y105, 🎹 Piano Sheet:
Gui, Add, Edit, x20 y125 w280 h190 vPianoMusic gSheetChanged -Wrap WantTab VScroll

; === Lyrics (kanan) ===
Gui, Add, Text, x320 y105, 🎤 Lyrics:
Gui, Add, Edit, x320 y125 w280 h190 vLyrics -Wrap WantTab VScroll

; === Progress ===
Gui, Add, Text, x20 y330, 📊 Progress:
Gui, Add, Edit, ReadOnly x20 y350 w580 h60 vNextNotes

; === Progress Bar ===
Gui, Add, Progress, x20 y420 w580 h20 BackgroundFFFFFF cGreen vProgressBar

; === Tempo + Auto Mode ===
Gui, Add, Checkbox, x20 y450 vAutoMode, ⏱ Auto Tempo
Gui, Add, Slider, x120 y447 w150 vTempoValue Range10-500 TickInterval50 ToolTip, 120

; === How to use ===
Gui, Add, Text, x20 y480, 📘 How to use :
Gui, Add, Text, x40 y500, Auto : Checklist the box and Adjust the Tempo then press F5 to Play/Stop
Gui, Add, Text, x40 y520, Manual : Press arrow ← ↑ ↓ ➝, play with rhythm

; === Buttons ===
btnY := 550
btnW := 85
btnH := 28
gap := 15
btnX := 20

Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% vTogglePlayStopButton gTogglePlayStop, ► Play
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gReset, ↻ Reset
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gClearAll, 🧹 Clear
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gSaveSheet, 💾 Save
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gLoadSheet, 📁 Load
btnX += btnW + gap
Gui, Add, Button, x%btnX% y%btnY% w%btnW% h%btnH% gGuiClose, ✖ Exit

Gui, Show, w680 h620, Roblox Virtual Piano Autoplayer
return

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
    global PianoMusic, CurrentPos, DisplayPos, isPlaying

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
        }
    }
}

; === AutoPlay ===
AutoPlay:
    SetTimer, AutoPlay, Off
    if (!isPlaying)
        return
    PlayNextNote()
    SetTimer, AutoPlay, -%KeyDelay%
return

; === Hotkeys Manual ===
$Left::PlayNextNote()
$Right::PlayNextNote()
$Up::PlayNextNote()
$Down::PlayNextNote()

; === Hotkey F5 Play/Pause ===
$F5::
    GoSub, TogglePlayStop
return

; === Button Actions ===
TogglePlayStop:
    Gui, Submit, Nohide
    if (!isPlaying) {
        isPlaying := true
        GuiControl,, TogglePlayStopButton, ■ Pause
        if (AutoMode) {
            KeyDelay := TempoValue
            SetTimer, AutoPlay, 10
        }
    } else {
        isPlaying := false
        GuiControl,, TogglePlayStopButton, ► Play
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
    KeyDelay := 120
    GuiControl,, PianoMusic
    GuiControl,, Lyrics
    GuiControl,, TransposeValue, 0
    GuiControl,, TempoValue, 120
    GuiControl,, NextNotes
    GuiControl,, ProgressBar, 0
    GuiControl,, FileName, 📁 [No file loaded]
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
        GuiControl,, FileName, 📁 %fileNameOnly%
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
        GuiControl,, FileName, 📁 %fileNameOnly%
    }
return

SheetChanged:
    Gui, Submit, Nohide
    PianoMusic := RegExReplace(PianoMusic, "-|,|\.")
    GuiControl,, PianoMusic, %PianoMusic%
return

; === License check timer ===
CheckLicense:
    result := Login(gLicenseCode)
    if (!result.success) {
        errMsg := result.error
        SetTimer, CheckLicense, Off
        Gui, Destroy
        MsgBox, 48, License Expired, Your license has expired or been suspended.`n`n%errMsg%
        ExitApp
    }
return

GuiClose:
    ExitApp