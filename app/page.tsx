'use client';

import Image from 'next/image';
import {
  ArrowDownRight, ArrowRight, BriefcaseBusiness, Check, ChevronDown,
  Compass, ExternalLink, Filter, GraduationCap, Link2, MapPin, Menu,
  MessageCircle, RotateCcw, Search, Sparkles, Users, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { members, professions, projectRoles, specialties, type Member } from '@/lib/members';

const stages = ['Investigación', 'Análisis', 'Diseño', 'Desarrollo', 'Validación', 'Implementación'];
const navItems = [
  ['Inicio', '#inicio'], ['Equipo', '#equipo'], ['Proyecto', '#proyecto'],
  ['Nuestra participación', '#participacion'], ['Contacto', '#contacto'],
];

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => unknown;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
}

function MemberPhoto({ member, large = false }: { member: Member; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={large ? 'profile-photo' : 'member-photo'}>
      <span aria-hidden="true">{initials(member.nombre)}</span>
      {!failed && <img src={member.foto} alt={`Fotografía profesional de ${member.nombre}`} loading={large ? 'eager' : 'lazy'} onError={() => setFailed(true)} />}
    </div>
  );
}

function MemberCard({ member, onOpen }: { member: Member; onOpen: () => void }) {
  return (
    <article className="member-card">
      <MemberPhoto member={member} />
      <div className="member-meta">
        <span>{member.rolesProyecto[0]}</span>
        <h3>{member.nombre}</h3>
        <p>{member.profesion}</p>
        <small>{member.especialidad}</small>
      </div>
      <button onClick={onOpen} aria-label={`Ver perfil de ${member.nombre}`}>Ver perfil <ArrowDownRight size={17} /></button>
    </article>
  );
}

function Filters({ profession, specialty, role, setProfession, setSpecialty, setRole, clear }: {
  profession: string; specialty: string; role: string;
  setProfession: (value: string) => void; setSpecialty: (value: string) => void; setRole: (value: string) => void; clear: () => void;
}) {
  return (
    <div className="filters-row">
      <NativeSelect value={profession} onChange={(event) => setProfession(event.target.value)} aria-label="Filtrar por profesión">
        <NativeSelectOption value="">Todas las profesiones</NativeSelectOption>
        {professions.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect value={specialty} onChange={(event) => setSpecialty(event.target.value)} aria-label="Filtrar por especialidad">
        <NativeSelectOption value="">Todas las especialidades</NativeSelectOption>
        {specialties.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filtrar por rol en el proyecto">
        <NativeSelectOption value="">Todos los roles</NativeSelectOption>
        {projectRoles.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}
      </NativeSelect>
      <Button variant="ghost" className="clear-filters" onClick={clear}><RotateCcw /> Limpiar filtros</Button>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [profession, setProfession] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [role, setRole] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    const term = query.toLocaleLowerCase('es').trim();
    return members.filter((member) => {
      const searchable = [member.nombre, member.profesion, member.especialidad, member.cargo, ...member.areas, ...member.rolesProyecto].join(' ').toLocaleLowerCase('es');
      return (!term || searchable.includes(term)) && (!profession || member.profesion === profession) && (!specialty || member.especialidad === specialty) && (!role || member.rolesProyecto.includes(role));
    });
  }, [query, profession, specialty, role]);

  const uniqueAreas = new Set(members.flatMap((member) => member.areas)).size;
  const clearFilters = () => { setProfession(''); setSpecialty(''); setRole(''); setQuery(''); setVisibleCount(8); };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const valid = (value: unknown, options: string[]) => typeof value === 'string' && (!value || options.includes(value));

    void Promise.resolve(context.registerTool({
      name: 'search_team_directory',
      title: 'Buscar en el directorio de Casa Altair',
      description: 'Busca integrantes y aplica filtros visibles por profesión, especialidad o rol en el proyecto.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          profession: { type: 'string', enum: ['', ...professions] },
          specialty: { type: 'string', enum: ['', ...specialties] },
          projectRole: { type: 'string', enum: ['', ...projectRoles] },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('La búsqueda debe ser un objeto.');
        const values = input as Record<string, unknown>;
        const nextQuery = typeof values.query === 'string' ? values.query.trim() : '';
        const nextProfession = values.profession ?? '';
        const nextSpecialty = values.specialty ?? '';
        const nextRole = values.projectRole ?? '';
        if (!valid(nextProfession, professions) || !valid(nextSpecialty, specialties) || !valid(nextRole, projectRoles)) throw new Error('Uno de los filtros no es válido.');
        const resultCount = members.filter((member) => {
          const searchable = [member.nombre, member.profesion, member.especialidad, member.cargo, ...member.areas, ...member.rolesProyecto].join(' ').toLocaleLowerCase('es');
          return (!nextQuery || searchable.includes(nextQuery.toLocaleLowerCase('es'))) && (!nextProfession || member.profesion === nextProfession) && (!nextSpecialty || member.especialidad === nextSpecialty) && (!nextRole || member.rolesProyecto.includes(nextRole as string));
        }).length;
        setQuery(nextQuery);
        setProfession(nextProfession as string);
        setSpecialty(nextSpecialty as string);
        setRole(nextRole as string);
        setVisibleCount(8);
        document.getElementById('equipo')?.scrollIntoView({ behavior: 'smooth' });
        return { resultCount, query: nextQuery, profession: nextProfession, specialty: nextSpecialty, projectRole: nextRole };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Casa Altair, inicio"><span className="brand-mark"><Compass size={20} /></span><span><strong>CASA ALTAIR</strong><small>CLUB EQUILIBRIA 360</small></span></a>
        <nav className="desktop-nav" aria-label="Navegación principal">{navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
        <a className="nav-cta" href="#equipo">Conoce al equipo</a>
        <Sheet><SheetTrigger render={<Button className="menu-button" variant="ghost" size="icon" aria-label="Abrir menú" />}><Menu /></SheetTrigger>
          <SheetContent className="mobile-sheet" side="right"><SheetHeader><SheetTitle>CASA ALTAIR</SheetTitle><SheetDescription>Club Equilibria 360</SheetDescription></SheetHeader><nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map(([label, href]) => <SheetClose key={href} render={<a href={href} />}>{label}<ArrowRight size={17} /></SheetClose>)}</nav></SheetContent>
        </Sheet>
      </header>

      <section className="hero" id="inicio"><div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" /><div className="hero-grid"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15} /> CLUB EQUILIBRIA 360 · CASA ALTAIR</div><h1>Conoce al equipo <span>detrás del proyecto</span></h1><p className="hero-lead">Talento, conocimiento, investigación y tecnología trabajando juntos para transformar ideas en soluciones.</p><div className="hero-actions"><a className="primary-button" href="#equipo">Explorar equipo <ArrowDownRight size={18} /></a><span className="hero-quote">“Observamos más lejos<br /> para decidir mejor.”</span></div></div><div className="hero-visual"><Image src="/altair-hero.jpeg" alt="Emblema dorado de Casa Altair con águila y tonos violeta" fill priority sizes="(max-width: 900px) 92vw, 42vw" /><div className="hero-visual-label"><span>Una comunidad</span><strong>con visión estratégica</strong></div></div></div></section>

      <section className="intro-section"><div className="section-kicker">Nuestra esencia</div><div className="intro-layout"><h2>Somos<br /><span>Casa Altair</span></h2><div><p>Casa Altair reúne profesionales y estudiantes con distintas experiencias y especialidades que comparten una visión orientada al análisis, la investigación, la innovación y la identificación de oportunidades.</p><div className="pillars"><span>Comunidad</span><span>Conocimiento</span><span>Oportunidades</span><span>Colaboración</span></div></div></div></section>

      <section className="team-section" id="equipo"><div className="section-heading"><div><div className="section-kicker">Directorio profesional</div><h2>Nuestro equipo</h2><p>Conoce a los profesionales que forman parte de Casa Altair.</p></div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'perfil encontrado' : 'perfiles encontrados'}</span></div>
        <div className="search-and-filter"><label className="search-box"><Search size={20} /><Input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(8); }} placeholder="Buscar integrante por nombre, profesión o especialidad..." aria-label="Buscar integrantes" />{query && <button onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={17} /></button>}</label><Button variant="outline" className="mobile-filter-button" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><Filter /> Filtros <ChevronDown className={filtersOpen ? 'rotate' : ''} /></Button></div>
        <div className={filtersOpen ? 'filters-panel open' : 'filters-panel'}><Filters profession={profession} specialty={specialty} role={role} setProfession={setProfession} setSpecialty={setSpecialty} setRole={setRole} clear={clearFilters} /></div>
        {filtered.length ? <><div className="member-grid">{filtered.slice(0, visibleCount).map((member) => <MemberCard key={member.id} member={member} onOpen={() => setSelectedMember(member)} />)}</div>{visibleCount < filtered.length && <div className="load-more"><Button onClick={() => setVisibleCount((count) => count + 8)}>Ver más integrantes <ArrowDownRight /></Button></div>}</> : <div className="empty-state"><Search /><h3>No encontramos coincidencias</h3><p>Prueba con otro nombre, profesión o especialidad.</p><Button variant="outline" onClick={clearFilters}>Limpiar búsqueda</Button></div>}
      </section>

      <section className="stats-section" aria-label="Estadísticas del equipo"><div className="stats-grid"><div><strong>{members.length}</strong><span>Perfiles publicados</span></div><div><strong>{new Set(members.map((member) => member.profesion)).size}</strong><span>Profesiones</span></div><div><strong>{uniqueAreas}</strong><span>Áreas de experiencia</span></div><div><strong>1</strong><span>Visión compartida</span></div></div></section>

      <section className="project-section" id="proyecto"><div className="project-copy"><div className="section-kicker">Del conocimiento a la acción</div><h2>El proyecto</h2><p>Este proyecto nació del trabajo colaborativo de integrantes de Casa Altair, quienes combinaron distintas competencias profesionales, investigación, creatividad y herramientas digitales para desarrollar una solución innovadora.</p></div><div className="timeline" aria-label="Etapas del proyecto">{stages.map((stage, index) => <div className="timeline-step" key={stage}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong></div>)}</div></section>

      <section className="participation-section" id="participacion"><div className="participation-card"><span className="large-number">360°</span><div><div className="section-kicker">Nuestra participación</div><h2>Experiencias distintas.<br />Un propósito común.</h2><p>Cada integrante aporta una mirada especializada. El resultado es una red de conocimiento capaz de investigar, crear, validar y convertir oportunidades en soluciones aplicables.</p><a href="#equipo">Conocer sus aportes <ArrowRight size={18} /></a></div></div></section>

      <section className="contact-section" id="contacto"><div className="contact-glow" /><div className="contact-inner"><div className="section-kicker">Networking con propósito</div><h2>Conecta con<br />nuestro equipo</h2><p>Casa Altair es una comunidad orientada al conocimiento, la investigación, la innovación y la generación de nuevas oportunidades profesionales.</p><div className="contact-actions"><a className="primary-button" href="#equipo">Explorar perfiles <Users size={18} /></a><a className="secondary-button" href="#equipo">Conectar <ArrowRight size={18} /></a></div></div></section>

      <footer><div className="footer-brand"><span className="brand-mark"><Compass size={20} /></span><div><strong>CLUB EQUILIBRIA 360</strong><span>CASA ALTAIR</span></div></div><div className="footer-quote">“Observamos más lejos para decidir mejor.”<small>ANÁLISIS · INVESTIGACIÓN · ESTRATEGIA</small></div><p>© 2026 Club Equilibria 360 – Casa Altair</p></footer>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>{selectedMember && <DialogContent className="profile-dialog"><div className="profile-sidebar"><MemberPhoto member={selectedMember} large /><div className="profile-location"><MapPin size={15} /> {selectedMember.ciudad}</div></div><div className="profile-content"><DialogHeader><div className="profile-eyebrow">PERFIL PROFESIONAL · CASA ALTAIR</div><DialogTitle>{selectedMember.nombre}</DialogTitle><DialogDescription>{selectedMember.profesion} · {selectedMember.especialidad}</DialogDescription></DialogHeader><div className="profile-facts"><div><GraduationCap /><span>Grado académico<strong>{selectedMember.grado}</strong></span></div><div><BriefcaseBusiness /><span>Cargo actual<strong>{selectedMember.cargo}</strong><small>{selectedMember.empresa}</small></span></div><div><Compass /><span>Experiencia<strong>{selectedMember.experiencia}</strong></span></div></div><section className="about"><h3>Sobre mí</h3><p>{selectedMember.perfil}</p></section><section><h3>Áreas de experiencia</h3><div className="chips">{selectedMember.areas.map((area) => <span key={area}>{area}</span>)}</div></section><section className="project-contribution"><span>Mi participación en el proyecto</span><div className="chips role-chips">{selectedMember.rolesProyecto.map((item) => <span key={item}><Check size={12} /> {item}</span>)}</div><p>{selectedMember.aporteProyecto}</p></section><div className="profile-actions">{selectedMember.cv && <a href={selectedMember.cv} target="_blank" rel="noreferrer"><ExternalLink /> Ver CV</a>}{selectedMember.linkedin && <a href={selectedMember.linkedin} target="_blank" rel="noreferrer"><Link2 /> LinkedIn</a>}{selectedMember.autorizaContacto && selectedMember.whatsapp && <a className="whatsapp" href={`https://wa.me/${selectedMember.whatsapp}?text=${encodeURIComponent(`Hola ${selectedMember.nombre}, conocí tu perfil a través del proyecto de Casa Altair – Club Equilibria 360 y me gustaría ponerme en contacto contigo.`)}`} target="_blank" rel="noreferrer"><MessageCircle /> Contactar por WhatsApp</a>}</div></div></DialogContent>}</Dialog>
    </main>
  );
}
