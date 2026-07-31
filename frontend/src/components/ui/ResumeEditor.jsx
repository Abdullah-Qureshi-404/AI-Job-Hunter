import { useEffect, useRef, useState } from 'react';
import './ResumeEditor.css';

/**
 * Editable resume with PDF export.
 *
 * Every field is contentEditable, so the user can correct anything the model
 * produced before exporting. "Export PDF" opens the browser print dialog on a
 * print-only stylesheet, which produces selectable, machine-readable text -
 * the single most important property for getting through an ATS.
 *
 * The layout is a deliberately plain single column. Multi-column and
 * graphical resume templates are what ATS parsers mangle most often.
 */

function Editable({ value, onChange, tag: Tag = 'div', className, placeholder }) {
  const ref = useRef(null);

  // Only write into the DOM when the value diverges, otherwise the caret
  // jumps to the start on every keystroke.
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value || '';
    }
  }, [value]);

  return (
    <Tag
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange(e.currentTarget.innerText)}
    />
  );
}

// Render sections in the order they appear in the user's own resume.
const DEFAULT_ORDER = ['summary', 'skills', 'experience', 'projects', 'education'];

export default function ResumeEditor({ content, header, onChange, layout }) {
  const [data, setData] = useState(content);

  useEffect(() => setData(content), [content]);

  const update = (patch) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const updateList = (key, index, patch) => {
    const list = [...(data[key] || [])];
    list[index] = { ...list[index], ...patch };
    update({ [key]: list });
  };

  const removeFrom = (key, index) => {
    const list = [...(data[key] || [])];
    list.splice(index, 1);
    update({ [key]: list });
  };

  if (!data) return null;

  // Section order and typeface come from the uploaded resume when available.
  const order = (layout?.section_order?.length ? layout.section_order : DEFAULT_ORDER)
    .filter((key, i, arr) => arr.indexOf(key) === i);
  const missing = DEFAULT_ORDER.filter((key) => !order.includes(key));
  const sectionOrder = [...order, ...missing];
  const fontClass = layout?.font_family === 'serif' ? 'resume-serif' : 'resume-sans';

  const experience = data.experience || [];
  const projects = data.projects || [];
  const skills = data.skills || [];

  return (
    <div className={`resume-sheet ${fontClass}`} id="resume-sheet">
      {/* Header */}
      <header className="resume-header" style={{ textAlign: layout?.header_align === 'left' ? 'left' : 'center' }}>
        <Editable
          className="resume-name"
          value={header?.name || ''}
          placeholder="Your Name"
          onChange={(v) => onChange?.({ ...data, _name: v })}
        />
        <div className="resume-contact">{header?.contact}</div>
      </header>

      {/* Summary */}
      <section className="resume-section">
        <h2 className="resume-section-title">Professional Summary</h2>
        <Editable
          className="resume-text"
          value={data.summary || ''}
          placeholder="Summary"
          onChange={(v) => update({ summary: v })}
        />
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Skills</h2>
          <Editable
            className="resume-text"
            value={skills.join(' • ')}
            onChange={(v) =>
              update({ skills: v.split('•').map((s) => s.trim()).filter(Boolean) })
            }
          />
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} className="resume-entry">
              <button
                type="button"
                className="resume-remove"
                onClick={() => removeFrom('experience', i)}
                title="Remove this role"
              >
                ×
              </button>
              <div className="resume-entry-head">
                <Editable
                  className="resume-role"
                  value={exp.title || ''}
                  onChange={(v) => updateList('experience', i, { title: v })}
                />
                <Editable
                  className="resume-duration"
                  value={exp.duration || ''}
                  onChange={(v) => updateList('experience', i, { duration: v })}
                />
              </div>
              <Editable
                className="resume-company"
                value={exp.company || ''}
                onChange={(v) => updateList('experience', i, { company: v })}
              />
              <ul className="resume-bullets">
                {(exp.bullets || []).map((b, bi) => (
                  <li key={bi}>
                    <Editable
                      tag="span"
                      value={b}
                      onChange={(v) => {
                        const bullets = [...(exp.bullets || [])];
                        bullets[bi] = v;
                        updateList('experience', i, { bullets });
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} className="resume-entry">
              <button
                type="button"
                className="resume-remove"
                onClick={() => removeFrom('projects', i)}
                title="Remove this project"
              >
                ×
              </button>
              <Editable
                className="resume-role"
                value={proj.name || ''}
                onChange={(v) => updateList('projects', i, { name: v })}
              />
              <Editable
                className="resume-text"
                value={proj.description || ''}
                onChange={(v) => updateList('projects', i, { description: v })}
              />
              {(proj.tech_stack || []).length > 0 && (
                <Editable
                  className="resume-tech"
                  value={(proj.tech_stack || []).join(' • ')}
                  onChange={(v) =>
                    updateList('projects', i, {
                      tech_stack: v.split('•').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education?.degree && (
        <section className="resume-section">
          <h2 className="resume-section-title">Education</h2>
          <div className="resume-entry-head">
            <Editable
              className="resume-role"
              value={data.education.degree || ''}
              onChange={(v) =>
                update({ education: { ...data.education, degree: v } })
              }
            />
            <Editable
              className="resume-duration"
              value={data.education.year || ''}
              onChange={(v) =>
                update({ education: { ...data.education, year: v } })
              }
            />
          </div>
          <Editable
            className="resume-company"
            value={data.education.institution || ''}
            onChange={(v) =>
              update({ education: { ...data.education, institution: v } })
            }
          />
        </section>
      )}
    </div>
  );
}
