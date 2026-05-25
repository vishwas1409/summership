CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  team_leader_name VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_code VARCHAR(20) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  persona TEXT NULL,
  problem_statement TEXT NULL,
  solution_idea TEXT NULL,
  why_selected TEXT NULL,
  key_technologies TEXT NULL,
  domain VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_problems_domain (domain),
  INDEX idx_problems_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS problem_selections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NULL,
  problem_id INT NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  team_leader_name VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_problem_selections_participant
    FOREIGN KEY (participant_id) REFERENCES participants(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_problem_selections_problem
    FOREIGN KEY (problem_id) REFERENCES problems(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_problem_selections_participant (participant_id),
  INDEX idx_problem_selections_problem (problem_id),
  INDEX idx_problem_selections_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  problem_id INT NOT NULL,
  github_url VARCHAR(255) NOT NULL,
  deployed_url VARCHAR(255) NOT NULL,
  linkedin_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submissions_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

