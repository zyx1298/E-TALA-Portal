/**
 * E-TALA (Enhanced Teachers Administrative and Learning Assistant)
 * Unified Backend: Features Advanced Scheduling, Dynamic Time Extraction, Batch Assignment
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('E-TALA Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 1. DATABASE SETUP
 */
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    'Settings': ['SettingName', 'SettingValue'],
    'Users': ['UserID', 'Name', 'Role', 'Password', 'GradeLevel', 'Section', 'ProfilePic', 'Sex'],
    'Announcements': ['Date', 'Author', 'Target', 'Message'], 
    'Classes': ['SectionID', 'GradeLevel', 'Room', 'AdviserID'],
    'Schedules': ['ScheduleID', 'TeacherID', 'Subject', 'Section', 'Day', 'Time', 'Room'], 
    'Grades': ['SchoolYear', 'StudentID', 'StudentName', 'Subject', 'TeacherID', 'Q1', 'Q2', 'Q3', 'Q4', 'Final'],
    'Materials': ['MaterialID', 'TeacherID', 'Subject', 'Title', 'Link', 'TargetType', 'TargetID']
  };

  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight("bold").setBackground("#e0e0e0");
    }
  }
  
  if (ss.getSheetByName('Settings').getLastRow() === 1) {
    ss.getSheetByName('Settings').appendRow(['CurrentSchoolYear', '2025-2026']);
    ss.getSheetByName('Settings').appendRow(['TimeSlots_Default', JSON.stringify(["07:00 AM - 08:00 AM", "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 10:30 AM (Break)", "10:30 AM - 11:30 AM", "11:30 AM - 12:30 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM"])]);
  }
  if (ss.getSheetByName('Users').getLastRow() === 1) {
    ss.getSheetByName('Users').appendRow(['admin01', 'System Admin', 'Admin', 'pass123', '', '', '', '']);
    ss.getSheetByName('Users').appendRow(['teacher01', 'Juan Dela Cruz', 'Teacher', 'pass123', '', '', '', 'Male']);
    ss.getSheetByName('Users').appendRow(['student01', 'Maria Clara', 'Student', 'pass123', 'Grade 10', 'Grade 10 - Rizal', '', 'Female']);
    ss.getSheetByName('Grades').appendRow(['2025-2026', 'student01', 'Maria Clara', 'Science', 'teacher01', 85, 87, '', '', 86]);
    ss.getSheetByName('Classes').appendRow(['Grade 10 - Rizal', 'Grade 10', 'Room 101', 'teacher01']);
  }
}

/**
 * 2. AUTHENTICATION & PROFILE
 */
function loginUser(userId, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userId && data[i][3] == password) {
      return {
        success: true,
        userId: data[i][0],
        name: data[i][1],
        role: data[i][2],
        profilePic: data[i][6] || '',
        details: { gradeLevel: data[i][4], section: data[i][5], sex: data[i][7] },
        rowIndex: i + 1
      };
    }
  }
  return { success: false, message: "Invalid credentials. Please try again." };
}

function changePassword(userId, oldPass, newPass) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      if (data[i][3] === oldPass) {
        sheet.getRange(i + 1, 4).setValue(newPass);
        SpreadsheetApp.flush();
        return { success: true };
      } else {
        return { success: false, message: "Incorrect old password." };
      }
    }
  }
  return { success: false, message: "User not found." };
}

function updateProfilePicture(rowIndex, imageUrl) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  sheet.getRange(rowIndex, 7).setValue(imageUrl);
  SpreadsheetApp.flush();
  return imageUrl;
}

/**
 * 3. DATA FETCHING
 */
function getPortalData(role, userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let data = {};
  
  let settingsRows = getSheetDataAsObjects(ss.getSheetByName('Settings'));
  data.settings = {};
  settingsRows.forEach(s => data.settings[s.SettingName] = s.SettingValue);
  data.currentSY = data.settings['CurrentSchoolYear'] || '2025-2026';
  
  let allAnnouncements = getSheetDataAsObjects(ss.getSheetByName('Announcements'));
  data.users = getSheetDataAsObjects(ss.getSheetByName('Users')); 
  data.teachers = data.users.filter(u => u.Role === 'Teacher');
  data.classes = getSheetDataAsObjects(ss.getSheetByName('Classes'));

  if (role === 'Admin') {
    data.announcements = allAnnouncements;
    data.schedules = getSheetDataAsObjects(ss.getSheetByName('Schedules'));
    data.allGrades = getSheetDataAsObjects(ss.getSheetByName('Grades')); 
  } 
  else if (role === 'Teacher') {
    data.announcements = allAnnouncements.filter(a => a.Target === 'All' || a.Target === 'Teachers');
    const allGrades = getSheetDataAsObjects(ss.getSheetByName('Grades'));
    const allSchedules = getSheetDataAsObjects(ss.getSheetByName('Schedules'));
    data.myGrades = allGrades.filter(g => g.TeacherID == userId);
    data.myMaterials = getSheetDataAsObjects(ss.getSheetByName('Materials')).filter(m => m.TeacherID == userId);
    data.mySchedules = allSchedules.filter(s => s.TeacherID == userId);
    
    // Extra fields for Teacher Advisory Tab
    const myAdvisedSections = data.classes.filter(c => c.AdviserID === userId).map(c => c.SectionID);
    data.myAdvisedSections = myAdvisedSections;
    if (myAdvisedSections.length > 0) {
        const myAdvisedStudents = data.users.filter(u => u.Role === 'Student' && myAdvisedSections.includes(u.Section)).map(u => u.UserID);
        data.advisedGrades = allGrades.filter(g => myAdvisedStudents.includes(g.StudentID));
        data.advisedSchedules = allSchedules.filter(s => myAdvisedSections.includes(s.Section));
    } else {
        data.advisedGrades = [];
        data.advisedSchedules = [];
    }
  } 
  else if (role === 'Student') {
    const me = data.users.find(u => u.UserID === userId);
    const mySection = me ? me.Section : '';
    data.announcements = allAnnouncements.filter(a => a.Target === 'All' || a.Target === 'Students');
    data.myGrades = getSheetDataAsObjects(ss.getSheetByName('Grades')).filter(g => g.StudentID == userId);
    data.materials = getSheetDataAsObjects(ss.getSheetByName('Materials')).filter(m => {
       if (!m.TargetType) return true; 
       if (m.TargetType === 'Section' && m.TargetID === mySection) return true;
       if (m.TargetType === 'Student' && m.TargetID === userId) return true;
       return false;
    });
    data.mySchedules = getSheetDataAsObjects(ss.getSheetByName('Schedules')).filter(s => s.Section === mySection);
  }
  return data;
}



function updateSchoolYear(newSY, autoPromote) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  const data = settingsSheet.getDataRange().getValues();
  let updated = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'CurrentSchoolYear') {
      settingsSheet.getRange(i + 1, 2).setValue(newSY);
      updated = true;
      break;
    }
  }
  if (!updated) {
    settingsSheet.appendRow(['CurrentSchoolYear', newSY]);
  }

  if (autoPromote) {
    const userSheet = ss.getSheetByName('Users');
    const userData = userSheet.getDataRange().getValues();
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][2] === 'Student') {
        let currentGrade = String(userData[i][4] || '').trim();
        if (currentGrade.toLowerCase() !== 'graduated') {
           let match = currentGrade.match(/\d+/);
           if (match) {
              let num = parseInt(match[0], 10);
              if (num < 12) {
                 userSheet.getRange(i + 1, 5).setValue(`Grade ${num + 1}`);
              } else if (num === 12) {
                 userSheet.getRange(i + 1, 5).setValue('Graduated');
              }
           }
        }
        userSheet.getRange(i + 1, 6).setValue('');
      }
    }
  }
  SpreadsheetApp.flush();
  return newSY;
}

function updateTimeSlots(sectionId, timesArray) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  const data = sheet.getDataRange().getValues();
  const key = sectionId ? 'TimeSlots_' + sectionId : 'TimeSlots_Default';
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(timesArray));
      SpreadsheetApp.flush();
      return timesArray;
    }
  }
  sheet.appendRow([key, JSON.stringify(timesArray)]);
  SpreadsheetApp.flush();
  return timesArray;
}

function batchUpdateTimeSlots(mode, sectionId, gradeLevel, timesArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  const classSheet = ss.getSheetByName('Classes');
  const classData = classSheet.getDataRange().getValues();
  const sectionsToUpdate = [];
  
  if (mode === 'section') {
    sectionsToUpdate.push(sectionId);
  } else if (mode === 'all') {
    sectionsToUpdate.push('Default');
    for (let i = 1; i < classData.length; i++) sectionsToUpdate.push(classData[i][0]);
  } else {
    const jhsGrades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    const shsGrades = ['Grade 11', 'Grade 12'];
    for (let i = 1; i < classData.length; i++) {
      let sec = classData[i][0]; let lvl = classData[i][1];
      if (mode === 'grade' && lvl === gradeLevel) sectionsToUpdate.push(sec);
      if (mode === 'jhs' && jhsGrades.includes(lvl)) sectionsToUpdate.push(sec);
      if (mode === 'shs' && shsGrades.includes(lvl)) sectionsToUpdate.push(sec);
    }
  }
  
  const settingsData = settingsSheet.getDataRange().getValues();
  const strTimes = JSON.stringify(timesArray);
  sectionsToUpdate.forEach(sec => {
    let key = sec === 'Default' ? 'TimeSlots_Default' : 'TimeSlots_' + sec;
    let found = false;
    for (let i = 1; i < settingsData.length; i++) {
      if (settingsData[i][0] === key) { settingsSheet.getRange(i + 1, 2).setValue(strTimes); found = true; break; }
    }
    if (!found) settingsSheet.appendRow([key, strTimes]);
  });
  SpreadsheetApp.flush();
  return true;
}

function saveAnnouncement(author, target, message) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Announcements');
  sheet.appendRow([new Date().toLocaleString(), author, target, message]);
  SpreadsheetApp.flush();
  return getSheetDataAsObjects(sheet);
}

function addUser(name, role, grade, section, sex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const prefix = role === 'Student' ? 'STU' : (role === 'Teacher' ? 'TCH' : 'ADM');
  const newUid = prefix + Math.floor(10000 + Math.random() * 90000); 
  const newPass = Math.random().toString(36).slice(-8); 
  sheet.appendRow([newUid, name, role, newPass, grade, section, '', sex || '']);
  SpreadsheetApp.flush();
  return { users: getSheetDataAsObjects(sheet), newId: newUid, newPass: newPass };
}

function editUser(rowIndex, name, role, grade, section, sex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  sheet.getRange(rowIndex, 2).setValue(name);
  sheet.getRange(rowIndex, 3).setValue(role);
  sheet.getRange(rowIndex, 5).setValue(grade);
  sheet.getRange(rowIndex, 6).setValue(section);
  sheet.getRange(rowIndex, 8).setValue(sex);
  SpreadsheetApp.flush();
  return getSheetDataAsObjects(sheet);
}

function updateSectionRoster(sectionId, gradeLevel, addIds, removeIds) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'Student') {
      let uid = data[i][0].toString();
      if (addIds.includes(uid)) {
        sheet.getRange(i + 1, 5).setValue(gradeLevel);
        sheet.getRange(i + 1, 6).setValue(sectionId);
      } else if (removeIds.includes(uid)) {
        sheet.getRange(i + 1, 5).setValue('');
        sheet.getRange(i + 1, 6).setValue('');
      }
    }
  }
  SpreadsheetApp.flush();
  return getSheetDataAsObjects(sheet);
}

function saveGradesBatch(gradesBatch) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Grades');
  gradesBatch.forEach(g => {
    let sum = 0, count = 0;
    [g.q1, g.q2, g.q3, g.q4].forEach(q => {
      if (q !== '' && q !== null && !isNaN(q)) { sum += Number(q); count++; }
    });
    let finalGrade = count > 0 ? Math.round(sum / count) : '';
    sheet.getRange(g.rowIndex, 6, 1, 5).setValues([[g.q1, g.q2, g.q3, g.q4, finalGrade]]);
  });
  SpreadsheetApp.flush();
  return true;
}

function addMaterial(teacherId, subject, title, link, targetType, targetId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Materials');
  sheet.appendRow(['MAT' + new Date().getTime(), teacherId, subject, title, link, targetType, targetId]);
  SpreadsheetApp.flush();
  return getSheetDataAsObjects(sheet).filter(m => m.TeacherID == teacherId);
}

function addClassSection(sectionName, gradeLevel, room, adviserId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Classes');
  if (getSheetDataAsObjects(sheet).some(c => c.SectionID.toLowerCase() === sectionName.toLowerCase())) {
     throw new Error("Section already exists.");
  }
  sheet.appendRow([sectionName, gradeLevel, room, adviserId]);
  SpreadsheetApp.flush();
  return getSheetDataAsObjects(sheet);
}

function saveScheduleBatch(sectionName, schedulesArray) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Schedules');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][3] === sectionName) sheet.deleteRow(i + 1);
  }
  SpreadsheetApp.flush();
  
  if (schedulesArray && schedulesArray.length > 0) {
    const newRows = schedulesArray.map(sched => [
      'SCH' + new Date().getTime() + Math.floor(Math.random() * 1000), 
      sched.teacherId, 
      sched.subject, 
      sectionName, 
      sched.day, 
      "'" + sched.time, 
      sched.room || 'TBA'
    ]);
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  SpreadsheetApp.flush();
  return getSheetDataAsObjects(sheet);
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map((row, index) => {
    let obj = { _rowIndex: index + 2 }; 
    headers.forEach((header, colIndex) => {
      let val = row[colIndex];
      if (val instanceof Date) val = val.toLocaleDateString() + ' ' + val.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      if (typeof val === 'string' && val.startsWith("'")) val = val.substring(1);
      obj[header] = val;
    });
    return obj;
  });
}
