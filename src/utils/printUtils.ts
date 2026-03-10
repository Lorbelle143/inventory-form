// Print submission details
export const printSubmission = (submission: any) => {
  const formData = submission.form_data || {};
  
  // Create a hidden iframe for printing instead of popup window
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    alert('Unable to open print dialog. Please try again.');
    document.body.removeChild(iframe);
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Inventory - ${submission.full_name}</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .header p {
          color: #64748b;
          margin: 5px 0;
          font-size: 14px;
        }
        .photo {
          text-align: center;
          margin: 20px 0;
        }
        .photo img {
          width: 150px;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        .section-title {
          background: #2563eb;
          color: white;
          padding: 10px 15px;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        .field {
          display: flex;
          margin: 10px 0;
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .field-label {
          font-weight: bold;
          width: 200px;
          color: #475569;
          font-size: 14px;
        }
        .field-value {
          flex: 1;
          color: #1e293b;
          font-size: 14px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 20px;
          }
          @page {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Northern Bukidnon State College</h1>
        <p>Guidance and Counseling Office</p>
        <p><strong>Student Inventory Form</strong></p>
      </div>

      ${submission.photo_url ? `
        <div class="photo">
          <img src="${submission.photo_url}" alt="Student Photo" crossorigin="anonymous" />
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Basic Information</div>
        <div class="field">
          <div class="field-label">Full Name:</div>
          <div class="field-value">${formData.firstName || ''} ${formData.middleInitial || ''} ${formData.lastName || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Student ID:</div>
          <div class="field-value">${formData.idNo || submission.student_id || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Program & Year:</div>
          <div class="field-value">${formData.programYear || submission.course || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Birth Date:</div>
          <div class="field-value">${formData.birthDate || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Gender:</div>
          <div class="field-value">${formData.gender || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Civil Status:</div>
          <div class="field-value">${formData.civilStatus || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Mobile Phone:</div>
          <div class="field-value">${formData.mobilePhone || submission.contact_number || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Email:</div>
          <div class="field-value">${formData.institutionalEmail || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Permanent Address:</div>
          <div class="field-value">${formData.permanentAddress || ''}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Family Background</div>
        <div class="field">
          <div class="field-label">Mother's Name:</div>
          <div class="field-value">${formData.motherName || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Mother's Occupation:</div>
          <div class="field-value">${formData.motherOccupation || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Father's Name:</div>
          <div class="field-value">${formData.fatherName || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Father's Occupation:</div>
          <div class="field-value">${formData.fatherOccupation || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Number of Siblings:</div>
          <div class="field-value">${formData.numberOfSiblings || ''}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Interests & Activities</div>
        <div class="field">
          <div class="field-label">Hobbies:</div>
          <div class="field-value">${formData.hobbies || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Talents:</div>
          <div class="field-value">${formData.talents || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Sports:</div>
          <div class="field-value">${formData.sports || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Organizations:</div>
          <div class="field-value">${formData.schoolOrg || ''}</div>
        </div>
      </div>

      <div class="footer">
        <p>Printed on: ${new Date().toLocaleString()}</p>
        <p>Submitted on: ${new Date(submission.created_at).toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        alert('Unable to print. Please check your printer connection and try again.');
        document.body.removeChild(iframe);
      }
    }, 500);
  };
};

// Print all submissions (for admin)
export const printAllSubmissions = (submissions: any[]) => {
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    alert('Unable to open print dialog. Please try again.');
    document.body.removeChild(iframe);
    return;
  }

  const rows = submissions.map(s => {
    const formData = s.form_data || {};
    return `
      <tr>
        <td>${s.student_id || ''}</td>
        <td>${formData.lastName || ''}</td>
        <td>${formData.firstName || ''}</td>
        <td>${s.course || ''}</td>
        <td>${s.year_level || ''}</td>
        <td>${s.contact_number || ''}</td>
        <td>${new Date(s.created_at).toLocaleDateString()}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Inventory Report</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .header p {
          color: #64748b;
          margin: 5px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background-color: #2563eb;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        @media print {
          @page {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Northern Bukidnon State College</h1>
        <p>Guidance and Counseling Office</p>
        <p><strong>Student Inventory Report</strong></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Course</th>
            <th>Year</th>
            <th>Contact</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        <p>Total Students: ${submissions.length}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        alert('Unable to print. Please check your printer connection and try again.');
        document.body.removeChild(iframe);
      }
    }, 500);
  };
};
