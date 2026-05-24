-- Core Roles & Users
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL -- Admin, HR Manager, Training Manager, Department Head, Trainer, Employee
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  head_user_id INT REFERENCES users(id)
);

-- Employees (Expanded)
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  emp_no VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  department_id INT REFERENCES departments(id),
  designation VARCHAR(100),
  join_date DATE,
  contact_number VARCHAR(50),
  email VARCHAR(150) UNIQUE,
  status VARCHAR(50) DEFAULT 'Active', -- Active, On Leave, Resigned
  profile_image_url VARCHAR(255),
  user_id INT REFERENCES users(id) -- Optional link to login account
);

-- Trainings (Expanded)
CREATE TABLE trainings (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(200) NOT NULL,
  category VARCHAR(100), -- Interdepartment, HR, SOP, Fire & Safety, etc.
  venue VARCHAR(100),
  duration_minutes INT,
  trainer_id INT REFERENCES users(id),
  training_date TIMESTAMP NOT NULL,
  google_form_link VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Scheduled' -- Scheduled, In Progress, Completed
);

-- Attendance
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  training_id INT REFERENCES trainings(id),
  employee_id INT REFERENCES employees(id),
  method VARCHAR(50), -- Manual, QR, OCR
  status VARCHAR(50), -- Present, Absent, Late
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OJT Records
CREATE TABLE ojt_records (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id),
  topic VARCHAR(200),
  trainer_id INT REFERENCES users(id),
  location VARCHAR(150),
  assessment_notes TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  pass_fail BOOLEAN,
  completion_status VARCHAR(50),
  signature_url VARCHAR(255)
);

-- Questionnaire Results (from Google Forms)
CREATE TABLE questionnaire_results (
  id SERIAL PRIMARY KEY,
  training_id INT REFERENCES trainings(id),
  employee_id INT REFERENCES employees(id),
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  passed BOOLEAN,
  submitted_at TIMESTAMP
);

-- Insert Default Roles
INSERT INTO roles (role_name) VALUES 
('System Admin'), ('Training Manager'), ('HR Manager'), 
('Department Head'), ('Trainer'), ('Employee');
