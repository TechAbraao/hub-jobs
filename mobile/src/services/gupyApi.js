// Consulta as vagas da Gupy passando pelo backend (rota GET /jobs/gupy),
// porque o navegador bloqueia a chamada direta à Gupy por CORS.

const API_URL = 'http://localhost:5000';
const GUPY_URL = `${API_URL}/jobs/gupy`;
const TERMO_PADRAO = 'desenvolvedor';

const MODALIDADES = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  'on-site': 'Presencial',
};

const CONTRATOS = {
  vacancy_type_effective: 'Efetivo',
  vacancy_type_internship: 'Estágio',
  vacancy_type_apprentice: 'Aprendiz',
  vacancy_type_temporary: 'Temporário',
  vacancy_type_talent_pool: 'Banco de talentos',
};

function limparHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Converte uma vaga da Gupy para o mesmo formato que o normalizeJob() do App.js devolve
function mapGupyJob(job) {
  const titulo = job?.name || job?.title || 'N/A';
  const empresa = job?.careerPageName || job?.companyName || 'N/A';
  const local = [job?.city, job?.state].filter(Boolean).join(' - ') || (job?.isRemoteWork ? 'Remoto' : 'N/A');
  const descricao = limparHtml(job?.description) || 'N/A';

  return {
    id: `gupy-${job?.id ?? `${empresa}-${titulo}`}`,
    origem: 'gupy',
    cargo: titulo,
    empresa,
    local,
    modalidade: MODALIDADES[job?.workplaceType] || (job?.isRemoteWork ? 'Remoto' : 'N/A'),
    categoria: 'N/A',
    contrato: CONTRATOS[job?.type] || 'N/A',
    nivel: 'N/A',
    salario: 'N/A',
    tempo: job?.publishedDate || 'N/A',
    descricao,
    requisitos: ['N/A'],
    beneficios: 'N/A',
    link: job?.jobUrl || '',
    company: empresa,
    title: titulo,
    location: local,
    description: descricao,
    platform: 'Gupy',
    salary: null,
  };
}

export async function listGupyJobs({ q, page = 1, perPage = 10, city } = {}) {
  const offset = (page - 1) * perPage;

  const params = new URLSearchParams({
    jobName: (q || '').trim() || TERMO_PADRAO,
    limit: String(perPage),
    offset: String(offset),
  });

  if (city) {
    params.append('city', city);
  }

  const response = await fetch(`${GUPY_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`A Gupy respondeu com erro ${response.status}.`);
  }

  const body = await response.json();
  const lista = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.results)
      ? body.results
      : [];

  const total = Number(body?.pagination?.total ?? lista.length);

  return {
    jobs: lista.map(mapGupyJob),
    pagination: {
      total,
      page,
      per_page: perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}