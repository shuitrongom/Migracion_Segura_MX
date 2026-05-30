'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { NACIONALIDADES, DOCUMENTOS_IDENTIFICACION_PERSONA } from '@/lib/catalogos-inm';
import { ESTADOS_MEXICO, MUNICIPIOS_POR_ESTADO, SECTORES_ACTIVIDAD } from '@/lib/catalogos-mexico';
import { DatePicker } from '@/components/ui/date-picker';

interface CieFormProps {
  propositoViaje: string;
  onChangePropositoViaje: (value: string) => void;
  solicitanteEmail: string;
  solicitanteEmailConfirmacion: string;
  onChangeEmail: (field: string, value: string) => void;
  comentarios: string;
  onChangeComentarios: (value: string) => void;
  onDataChange: (data: Record<string, unknown>) => void;
}

export default function CieForm({ propositoViaje, onChangePropositoViaje, solicitanteEmail, solicitanteEmailConfirmacion, onChangeEmail, comentarios, onChangeComentarios, onDataChange }: CieFormProps) {
  const [tipoPersona, setTipoPersona] = useState('');

  // Persona física
  const [fisica, setFisica] = useState({
    curp: '', rfc: '', nombre: '', apellidos: '', nacionalidad: '',
    tipoDocumento: '', numeroDocumento: '',
    codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
    numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
  });

  // Persona moral
  const [moral, setMoral] = useState({
    rfc: '', razonSocial: '', sector: '', giroComercial: '',
    codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
    numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
    numeroActa: '', fechaActa: '',
  });

  // Representantes legales (array dinámico)
  const [representantes, setRepresentantes] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string; lada: string; telefonoFijo: string }[]>([]);
  const [repTemp, setRepTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '', lada: '', telefonoFijo: '' });

  // Personas autorizadas (array dinámico)
  const [personasAutorizadas, setPersonasAutorizadas] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string }[]>([]);
  const [personaTemp, setPersonaTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });

  const updateFisica = (field: string, value: string) => {
    const upper = ['curp', 'rfc'];
    setFisica(prev => ({ ...prev, [field]: upper.includes(field) ? value.toUpperCase() : value }));
  };
  const updateMoral = (field: string, value: string) => {
    setMoral(prev => ({ ...prev, [field]: field === 'rfc' ? value.toUpperCase() : value }));
  };

  const handleAddRepresentante = () => {
    if (!repTemp.nombre.trim() || !repTemp.apellidos.trim()) { toast.error('Nombre y apellidos son obligatorios'); return; }
    setRepresentantes([...representantes, { ...repTemp }]);
    setRepTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '', lada: '', telefonoFijo: '' });
  };

  const handleAddPersona = () => {
    if (!personaTemp.nombre.trim() || !personaTemp.apellidos.trim()) { toast.error('Nombre y apellidos son obligatorios'); return; }
    setPersonasAutorizadas([...personasAutorizadas, { ...personaTemp }]);
    setPersonaTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  };

  // Notify parent of data changes
  const notifyParent = () => {
    onDataChange({ tipoPersona, fisica, moral, representantes, personasAutorizadas });
  };

  // Validate CURP
  const validateCurp = (value: string): string | null => {
    if (!value || value.length < 18) return null;
    if (value.length !== 18) return 'La CURP debe tener 18 caracteres';
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(value)) return 'Formato de CURP inválido';
    return null;
  };

  // Validate RFC
  const validateRfc = (value: string, isMoral: boolean): string | null => {
    if (!value) return null;
    const len = isMoral ? 12 : 13;
    if (value.length < len) return null;
    if (value.length !== len) return `El RFC debe tener ${len} caracteres`;
    const regex = isMoral ? /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/ : /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
    if (!regex.test(value)) return 'Formato de RFC inválido';
    return null;
  };

  const inputClass = 'w-full px-3 py-2.5 border border-white/[0.1] bg-white/[0.02]/50 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow';
  const inputClassUpper = 'w-full px-3 py-2.5 border border-white/[0.1] bg-white/[0.02]/50 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow';
  const inputClassEmail = 'w-full px-3 py-2.5 border border-white/[0.1] bg-white/[0.02]/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow';
  const sectionTitle = 'text-xl font-bold text-white mb-4 pb-3 border-b-[3px] border-amber-700';

  return (
    <div className="space-y-6">
      {/* Sección 1: ¿Qué deseas hacer? */}
      <div>
        <h3 className={sectionTitle}>¿Qué deseas hacer?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div><label className="block text-xs font-medium text-white/60 mb-1">¿Qué deseas hacer? *</label><select value={propositoViaje} onChange={e => onChangePropositoViaje(e.target.value)} className={inputClass}><option value="">Selecciona</option><option value="Obtener constancia de inscripción de empleador">Obtener constancia de inscripción de empleador</option><option value="Actualización de la constancia de inscripción de empleador">Actualización de la constancia de inscripción de empleador</option></select></div>
        </div>
      </div>

      {/* Sección 2: Datos de la empresa o persona */}
      <div>
        <h3 className={sectionTitle}>Datos de la empresa o persona que tendrá a su cargo o responsabilidad a extranjeros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-4">
          <div><label className="block text-xs font-medium text-white/60 mb-1">Tipo de persona *</label><select value={tipoPersona} onChange={e => { setTipoPersona(e.target.value); notifyParent(); }} className={inputClass}><option value="">Selecciona</option><option value="Física">Física</option><option value="Moral">Moral</option></select></div>
        </div>

        {/* Persona Física */}
        {tipoPersona === 'Física' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white/90 border-b pb-2">Datos de la persona física</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div><label className="block text-xs font-medium text-white/60 mb-1">CURP</label><input type="text" value={fisica.curp} onChange={e => updateFisica('curp', e.target.value)} className={inputClassUpper} maxLength={18} />{validateCurp(fisica.curp) && <p className="text-[11px] text-red-500 mt-1">{validateCurp(fisica.curp)}</p>}</div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">RFC *</label><input type="text" value={fisica.rfc} onChange={e => updateFisica('rfc', e.target.value)} className={inputClassUpper} maxLength={13} />{validateRfc(fisica.rfc, false) && <p className="text-[11px] text-red-500 mt-1">{validateRfc(fisica.rfc, false)}</p>}</div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Nombre(s) *</label><input type="text" value={fisica.nombre} onChange={e => updateFisica('nombre', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Apellido(s) *</label><input type="text" value={fisica.apellidos} onChange={e => updateFisica('apellidos', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Nacionalidad actual *</label><select value={fisica.nacionalidad} onChange={e => updateFisica('nacionalidad', e.target.value)} className={inputClass}><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Tipo de documento *</label><select value={fisica.tipoDocumento} onChange={e => updateFisica('tipoDocumento', e.target.value)} className={inputClass}><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION_PERSONA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Número de documento *</label><input type="text" value={fisica.numeroDocumento} onChange={e => updateFisica('numeroDocumento', e.target.value)} className={inputClass} /></div>
          </div>

          <h4 className="text-lg font-semibold text-white/90 border-b pb-2 pt-2">Domicilio de la persona física</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div><label className="block text-xs font-medium text-white/60 mb-1">Código postal *</label><input type="text" value={fisica.codigoPostal} onChange={e => updateFisica('codigoPostal', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Estado *</label><select value={fisica.estado} onChange={e => { updateFisica('estado', e.target.value); updateFisica('municipio', ''); }} className={inputClass}><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Municipio o Alcaldía *</label><select value={fisica.municipio} onChange={e => updateFisica('municipio', e.target.value)} className={inputClass}><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[fisica.estado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Colonia *</label><input type="text" value={fisica.colonia} onChange={e => updateFisica('colonia', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Calle *</label><input type="text" value={fisica.calle} onChange={e => updateFisica('calle', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Número exterior *</label><input type="text" value={fisica.numeroExterior} onChange={e => updateFisica('numeroExterior', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Número interior</label><input type="text" value={fisica.numeroInterior} onChange={e => updateFisica('numeroInterior', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Lada</label><input type="text" value={fisica.lada} onChange={e => updateFisica('lada', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Teléfono fijo</label><input type="text" value={fisica.telefonoFijo} onChange={e => updateFisica('telefonoFijo', e.target.value)} className={inputClass} /></div>
          </div>
        </div>
        )}

        {/* Persona Moral */}
        {tipoPersona === 'Moral' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white/90 border-b pb-2">Datos de la persona moral</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div><label className="block text-xs font-medium text-white/60 mb-1">RFC *</label><input type="text" value={moral.rfc} onChange={e => updateMoral('rfc', e.target.value)} className={inputClassUpper} maxLength={12} />{validateRfc(moral.rfc, true) && <p className="text-[11px] text-red-500 mt-1">{validateRfc(moral.rfc, true)}</p>}</div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Nombre o razón social *</label><input type="text" value={moral.razonSocial} onChange={e => updateMoral('razonSocial', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Sector o rama de actividad</label><select value={moral.sector} onChange={e => updateMoral('sector', e.target.value)} className={inputClass}><option value="">Selecciona</option>{SECTORES_ACTIVIDAD.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="md:col-span-3"><label className="block text-xs font-medium text-white/60 mb-1">Objeto de la empresa o giro comercial *</label><textarea value={moral.giroComercial} onChange={e => updateMoral('giroComercial', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-white/[0.1] bg-white/[0.02]/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow resize-none" /></div>
          </div>

          <h4 className="text-lg font-semibold text-white/90 border-b pb-2 pt-2">Domicilio de la persona moral</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div><label className="block text-xs font-medium text-white/60 mb-1">Código postal *</label><input type="text" value={moral.codigoPostal} onChange={e => updateMoral('codigoPostal', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Estado *</label><select value={moral.estado} onChange={e => { updateMoral('estado', e.target.value); updateMoral('municipio', ''); }} className={inputClass}><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Municipio o Alcaldía *</label><select value={moral.municipio} onChange={e => updateMoral('municipio', e.target.value)} className={inputClass}><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[moral.estado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Colonia *</label><input type="text" value={moral.colonia} onChange={e => updateMoral('colonia', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Calle *</label><input type="text" value={moral.calle} onChange={e => updateMoral('calle', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Número exterior *</label><input type="text" value={moral.numeroExterior} onChange={e => updateMoral('numeroExterior', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Número interior</label><input type="text" value={moral.numeroInterior} onChange={e => updateMoral('numeroInterior', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Lada</label><input type="text" value={moral.lada} onChange={e => updateMoral('lada', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Teléfono fijo</label><input type="text" value={moral.telefonoFijo} onChange={e => updateMoral('telefonoFijo', e.target.value)} className={inputClass} /></div>
          </div>

          <h4 className="text-lg font-semibold text-white/90 border-b pb-2 pt-2">Datos del acta constitutiva</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div><label className="block text-xs font-medium text-white/60 mb-1">Número de acta constitutiva</label><input type="text" value={moral.numeroActa} onChange={e => updateMoral('numeroActa', e.target.value)} className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1">Fecha de registro del acta</label><DatePicker value={moral.fechaActa} onChange={v => updateMoral('fechaActa', v)} yearRange={[1950, 2026]} /></div>
          </div>
        </div>
        )}
      </div>

      {/* Sección 3: Representante legal (solo Moral) */}
      {tipoPersona === 'Moral' && (
      <div>
        <h3 className={sectionTitle}>Datos del representante legal de la persona moral</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800 text-center">Se debe capturar el nombre del representante legal que tiene facultades para promover actos legales ante autoridades administrativas. Si usted quiere agregar representantes legales es necesario que lo efectúe con el botón &apos;Agregar representante&apos;, de lo contrario los datos capturados en esta sección no serán guardados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
          <div><label className="block text-xs font-medium text-white/60 mb-1">CURP</label><input type="text" value={repTemp.curp} onChange={e => setRepTemp(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))} className={inputClassUpper} maxLength={18} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Nombre(s) *</label><input type="text" value={repTemp.nombre} onChange={e => setRepTemp(prev => ({ ...prev, nombre: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Apellido(s) *</label><input type="text" value={repTemp.apellidos} onChange={e => setRepTemp(prev => ({ ...prev, apellidos: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Nacionalidad actual</label><select value={repTemp.nacionalidad} onChange={e => setRepTemp(prev => ({ ...prev, nacionalidad: e.target.value }))} className={inputClass}><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Tipo de documento de identificación</label><select value={repTemp.tipoDocumento} onChange={e => setRepTemp(prev => ({ ...prev, tipoDocumento: e.target.value }))} className={inputClass}><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION_PERSONA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Número de documento</label><input type="text" value={repTemp.numeroDocumento} onChange={e => setRepTemp(prev => ({ ...prev, numeroDocumento: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Lada</label><input type="text" value={repTemp.lada} onChange={e => setRepTemp(prev => ({ ...prev, lada: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Teléfono fijo</label><input type="text" value={repTemp.telefonoFijo} onChange={e => setRepTemp(prev => ({ ...prev, telefonoFijo: e.target.value }))} className={inputClass} /></div>
        </div>
        <div className="flex justify-end mt-4 max-w-4xl">
          <button type="button" onClick={handleAddRepresentante} className="px-4 py-2 border border-amber-500 text-amber-500 rounded-lg text-sm font-medium hover:bg-amber-500/10 transition-colors">Agregar representante</button>
        </div>
        {representantes.length > 0 && (
          <div className="mt-4 max-w-4xl">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead><tr className="bg-white/[0.02] border-b"><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Nombre</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Nacionalidad</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Documento</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>{representantes.map((r, i) => (<tr key={i} className="border-b last:border-0"><td className="px-3 py-2">{r.nombre} {r.apellidos}</td><td className="px-3 py-2">{r.nacionalidad}</td><td className="px-3 py-2">{r.tipoDocumento} {r.numeroDocumento}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => setRepresentantes(representantes.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Eliminar</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Sección 4: Correo electrónico */}
      <div>
        <h3 className={sectionTitle}>Correo electrónico para notificar al promovente</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800 text-center">Agrega la dirección de correo electrónico en donde se recibirán las notificaciones asociadas a tu trámite.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div><label className="block text-xs font-medium text-white/60 mb-1">Correo electrónico *</label><input type="email" value={solicitanteEmail} onChange={e => onChangeEmail('solicitanteEmail', e.target.value)} className={inputClassEmail} placeholder="nombre@correo.com" /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Correo electrónico (confirmación) *</label><input type="email" value={solicitanteEmailConfirmacion} onChange={e => onChangeEmail('solicitanteEmailConfirmacion', e.target.value)} className={inputClassEmail} placeholder="nombre@correo.com" /></div>
        </div>
      </div>

      {/* Sección 5: Persona autorizada */}
      <div>
        <h3 className={sectionTitle}>En su caso, persona autorizada para tramitar, oír o recibir notificaciones</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800 text-center">Si deseas agregar personas autorizadas es necesario que lo efectúes con el botón &apos;Agregar persona&apos;, de lo contrario los datos capturados en esta sección no serán guardados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
          <div><label className="block text-xs font-medium text-white/60 mb-1">CURP</label><input type="text" value={personaTemp.curp} onChange={e => setPersonaTemp(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))} className={inputClassUpper} maxLength={18} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Nombre(s) *</label><input type="text" value={personaTemp.nombre} onChange={e => setPersonaTemp(prev => ({ ...prev, nombre: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Apellido(s) *</label><input type="text" value={personaTemp.apellidos} onChange={e => setPersonaTemp(prev => ({ ...prev, apellidos: e.target.value }))} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Nacionalidad actual</label><select value={personaTemp.nacionalidad} onChange={e => setPersonaTemp(prev => ({ ...prev, nacionalidad: e.target.value }))} className={inputClass}><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Tipo de documento de identificación</label><select value={personaTemp.tipoDocumento} onChange={e => setPersonaTemp(prev => ({ ...prev, tipoDocumento: e.target.value }))} className={inputClass}><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION_PERSONA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-white/60 mb-1">Número de documento</label><input type="text" value={personaTemp.numeroDocumento} onChange={e => setPersonaTemp(prev => ({ ...prev, numeroDocumento: e.target.value }))} className={inputClass} /></div>
        </div>
        <div className="flex justify-end mt-4 max-w-4xl">
          <button type="button" onClick={handleAddPersona} className="px-4 py-2 border border-amber-500 text-amber-500 rounded-lg text-sm font-medium hover:bg-amber-500/10 transition-colors">Agregar persona</button>
        </div>
        {personasAutorizadas.length > 0 && (
          <div className="mt-4 max-w-4xl">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead><tr className="bg-white/[0.02] border-b"><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Nombre</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Nacionalidad</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Documento</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>{personasAutorizadas.map((p, i) => (<tr key={i} className="border-b last:border-0"><td className="px-3 py-2">{p.nombre} {p.apellidos}</td><td className="px-3 py-2">{p.nacionalidad}</td><td className="px-3 py-2">{p.tipoDocumento} {p.numeroDocumento}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => setPersonasAutorizadas(personasAutorizadas.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Eliminar</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección 6: Comentarios */}
      <div>
        <h3 className={sectionTitle}>Comentarios</h3>
        <p className="text-sm text-white/40 mb-3">Si lo deseas, puedes agregar algún comentario a la solicitud.</p>
        <textarea value={comentarios} onChange={e => onChangeComentarios(e.target.value)} rows={4} className="w-full max-w-4xl px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
        <p className="text-xs text-white/30 mt-2">* Campos obligatorios</p>
      </div>
    </div>
  );
}
