#!/usr/bin/env bash
set -Eeuo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"
TOTAL_JOBS="${TOTAL_JOBS:-200}"

usage() {
  cat <<'USAGE'
Uso:
  ./assets/scripts/seed_jobs.sh [--count 200] [--base-url http://localhost:5000]

Variáveis de ambiente também funcionam:
  API_BASE_URL=http://localhost:5000 TOTAL_JOBS=200 ./assets/scripts/seed_jobs.sh

Descrição:
  Gera e envia uma grande variedade de vagas válidas para a API de empregos.
  O endpoint usado é POST /jobs.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --count)
      TOTAL_JOBS="$2"
      shift 2
      ;;
    --base-url)
      API_BASE_URL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Opção desconhecida: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v curl >/dev/null 2>&1; then
  echo "Erro: curl não está instalado." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Erro: python3 não está instalado." >&2
  exit 1
fi

if ! [[ "$TOTAL_JOBS" =~ ^[0-9]+$ ]] || [[ "$TOTAL_JOBS" -lt 1 ]]; then
  echo "Erro: --count deve ser um número inteiro maior que 0." >&2
  exit 1
fi

API_BASE_URL="${API_BASE_URL%/}"

python3 - "$TOTAL_JOBS" <<'PY'
import json
import random
import sys

TOTAL_JOBS = int(sys.argv[1])

companies = [
    "Acme Tech", "Nexa Systems", "BluePeak", "NovaStack", "Quantivale",
    "SkyBridge Digital", "Lattice Labs", "FuturoFlow", "Orbital Metrics",
    "GridWorks", "Cobalt Studio", "Asterion Data", "Northwind AI", "Suma Cloud",
    "MavenWorks", "Harbor One", "VelocityX", "Elemental UX", "InovaLog", "CampusHub",
    "Zenit Core", "FluxoIA", "Aether Health", "Ponto Digital", "RioLabs", "LumenOps"
]

locations = [
    "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR",
    "Porto Alegre, RS", "Salvador, BA", "Fortaleza, CE", "Recife, PE", "Brasília, DF",
    "Campinas, SP", "Florianópolis, SC", "Joinville, SC", "Natal, RN", "Goiânia, GO",
    "São José dos Campos, SP", "Maceió, AL", "Aracaju, SE", "Manaus, AM", "Belém, PA",
    "Vitória, ES", "São Luís, MA", "Campo Grande, MS", "Teresina, PI", "Cuiabá, MT"
]

platforms = ["LinkedIn", "Indeed", "Glassdoor", "Gupy", "InfoJobs", "Carreira", "Catho"]
modalities = ["Remoto", "Híbrido", "Presencial", "Flexível"]
categories = ["Software", "Dados", "Design", "Infraestrutura", "Produto", "Marketing", "Operações"]
contracts = ["CLT", "PJ", "Estágio", "Temporário"]
levels = ["Junior", "Pleno", "Senior", "Especialista", "Tech Lead"]

templates = [
    {
        "title": "Desenvolvedor Backend Senior",
        "salary": (9500, 22000),
        "description": "Atuar no desenvolvimento de APIs, integrações e serviços críticos para produtos digitais de alta escala.",
        "requirements": [
            "Experiência com Python, Flask ou FastAPI.",
            "Conhecimento de APIs REST e bancos relacionais.",
            "Domínio de testes automatizados e versionamento com Git.",
            "Boa comunicação e trabalho em equipe."
        ],
        "benefits": "Vale alimentação, vale refeição, plano de saúde, home office e treinamento contínuo."
    },
    {
        "title": "Engenheiro de Dados",
        "salary": (8500, 19000),
        "description": "Responsável por coletar, transformar e disponibilizar dados para análise e negócio com alta qualidade.",
        "requirements": [
            "Experiência com SQL e modelagem de dados.",
            "Conhecimento em ETL e pipelines de dados.",
            "Uso de Python para automação e transformação de dados.",
            "Familiaridade com cloud e qualidade de dados."
        ],
        "benefits": "Plano odontológico, bônus por desempenho, ambiente híbrido e suporte para certificações."
    },
    {
        "title": "Product Manager",
        "salary": (12000, 26000),
        "description": "Definir prioridades, validar hipóteses e alinhar entregas com clientes, design e engenharia.",
        "requirements": [
            "Experiência com gestão de produtos digitais.",
            "Capacidade de priorização e análise de métricas.",
            "Boa comunicação com stakeholders.",
            "Conhecimento de metodologias ágeis."
        ],
        "benefits": "Plano de saúde, bônus anual, flexibilidade e desenvolvimento profissional."
    },
    {
        "title": "Analista de QA",
        "salary": (6000, 15000),
        "description": "Garantir a qualidade de software por meio de testes funcionais, automatizados e análise de regressão.",
        "requirements": [
            "Experiência em testes de API e UI.",
            "Conhecimento em Cypress, Playwright ou Selenium.",
            "Habilidade de criar cenários de teste e relatar defeitos.",
            "Boa documentação e organização."
        ],
        "benefits": "Vale alimentação, jornada flexível e parceria com academia."
    },
    {
        "title": "DevOps Engineer",
        "salary": (11000, 24000),
        "description": "Manter infraestrutura em nuvem, pipelines e automações para garantir disponibilidade e escalabilidade.",
        "requirements": [
            "Experiência com Docker, Kubernetes e Terraform.",
            "Conhecimento em CI/CD e monitoramento de serviços.",
            "Familiaridade com AWS, GCP ou Azure.",
            "Visão de segurança e observabilidade."
        ],
        "benefits": "Home office, plano de saúde, participação nos lucros e incentivo a certificações."
    },
    {
        "title": "UI/UX Designer",
        "salary": (7000, 18000),
        "description": "Criar interfaces intuitivas e experiências consistentes para usuários e produto digital.",
        "requirements": [
            "Domínio de Figma e design systems.",
            "Experiência em pesquisa e prototipagem de interfaces.",
            "Conhecimento de usabilidade e acessibilidade.",
            "Capacidade de negociar com stakeholders e produto."
        ],
        "benefits": "Vale refeição, ambiente criativo, workshops internos e oportunidade de atuar em projetos globais."
    },
    {
        "title": "Analista de Dados",
        "salary": (6500, 16000),
        "description": "Transformar dados em insights claros para apoiar decisões de negócio e operações.",
        "requirements": [
            "Experiência com Power BI ou Tableau.",
            "Boa análise de dados e storytelling.",
            "Conhecimento em SQL e modelagem analítica.",
            "Visão estratégica e comunicação."
        ],
        "benefits": "Bônus por metas, desenvolvimento técnico e flexibilidade de horário."
    },
    {
        "title": "Especialista em Segurança da Informação",
        "salary": (13000, 28000),
        "description": "Aplicar boas práticas de segurança, governança e monitoramento para proteger sistemas e dados.",
        "requirements": [
            "Experiência com segurança em cloud e análise de vulnerabilidades.",
            "Conhecimento de IAM, firewalls e políticas de acesso.",
            "Domínio de compliance e incident response.",
            "Boa capacidade analítica e documentação."
        ],
        "benefits": "Vale alimentação, plano de saúde, participação nos lucros e certificações pagas."
    },
    {
        "title": "Mobile Developer",
        "salary": (9000, 21000),
        "description": "Desenvolver soluções mobile com foco em qualidade, performance e experiência do usuário.",
        "requirements": [
            "Experiência em React Native ou Flutter.",
            "Conhecimento de navegação, estado e integrações nativas.",
            "Boa atenção a performance e arquitetura.",
            "Familiaridade com versionamento e entrega contínua."
        ],
        "benefits": "Home office, vale refeição, ambiente dinâmico e equipamentos modernos."
    },
    {
        "title": "Frontend Engineer",
        "salary": (8500, 19500),
        "description": "Construir interfaces robustas, performáticas e acessíveis para produtos digitais de alto impacto.",
        "requirements": [
            "Experiência com React, TypeScript e componentização.",
            "Conhecimento em HTML, CSS e design responsivo.",
            "Capacidade de escrever código limpo e reutilizável.",
            "Familiaridade com testes e integração contínua."
        ],
        "benefits": "Vale refeição, reforço pedagógico, plano de saúde e ambiente híbrido."
    }
]

used = set()

for idx in range(TOTAL_JOBS):
    template = templates[idx % len(templates)]
    company = companies[idx % len(companies)]
    location = locations[idx % len(locations)]
    platform = platforms[idx % len(platforms)]
    modality = modalities[idx % len(modalities)]
    category = categories[idx % len(categories)]
    contract = contracts[idx % len(contracts)]
    level = levels[idx % len(levels)]
    salary_min, salary_max = template["salary"]
    salary = round(random.uniform(salary_min, salary_max), 2)

    title = template["title"]
    title_key = f"{company}:{title}"
    while title_key in used:
        title = f"{title} {idx + 1}"
        title_key = f"{company}:{title}"
    used.add(title_key)

    summary = template["description"]
    if idx % 3 == 0:
        summary += " Valorizamos autonomia, qualidade e colaboração entre times."
    elif idx % 3 == 1:
        summary += " O time trabalha em projetos com impacto real para clientes e usuários."
    else:
        summary += " Buscamos alguém apaixonado por construir produtos de alta qualidade e performance."

    requirements = list(template["requirements"])
    if idx % 2 == 0:
        requirements.append("Capacidade de aprender rapidamente e trabalhar em ambiente dinâmico.")
    if idx % 4 == 0:
        requirements.append("Experiência com metodologias ágeis e colaboração com times multidisciplinares.")

    job = {
        "title": title,
        "description": summary,
        "company": company,
        "location": location,
        "url": f"https://{company.lower().replace(' ', '-').replace('.', '')}.{title.lower().replace(' ', '-')}.jobs/{idx + 1}",
        "platform": platform,
        "salary": salary,
        "modality": modality,
        "category": category,
        "contract": contract,
        "level": level,
        "requirements": requirements[:5],
        "benefits": template["benefits"],
        "tempo": "Full time" if idx % 2 == 0 else "Part time",
    }

    print(json.dumps(job, ensure_ascii=False))
PY

created=0
failed=0
processed=0

while IFS= read -r JOB_JSON; do
  [[ -z "$JOB_JSON" ]] && continue
  processed=$((processed + 1))

  RESPONSE_FILE=$(mktemp)
  HTTP_CODE=$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
    -X POST "$API_BASE_URL/jobs" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    --data "$JOB_JSON")

  if [[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]]; then
    created=$((created + 1))
  else
    failed=$((failed + 1))
    BODY=$(tr -d '\r' < "$RESPONSE_FILE")
    printf 'Falha (%s): %s\n' "$HTTP_CODE" "$BODY" >&2
  fi

  rm -f "$RESPONSE_FILE"

  if (( processed % 25 == 0 )); then
    printf 'Processadas: %s | criadas: %s | falhas: %s\n' "$processed" "$created" "$failed"
  fi
done < <(
  python3 - "$TOTAL_JOBS" <<'PY'
import json
import random
import sys

TOTAL_JOBS = int(sys.argv[1])

companies = [
    "Acme Tech", "Nexa Systems", "BluePeak", "NovaStack", "Quantivale",
    "SkyBridge Digital", "Lattice Labs", "FuturoFlow", "Orbital Metrics",
    "GridWorks", "Cobalt Studio", "Asterion Data", "Northwind AI", "Suma Cloud",
    "MavenWorks", "Harbor One", "VelocityX", "Elemental UX", "InovaLog", "CampusHub",
    "Zenit Core", "FluxoIA", "Aether Health", "Ponto Digital", "RioLabs", "LumenOps"
]

locations = [
    "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR",
    "Porto Alegre, RS", "Salvador, BA", "Fortaleza, CE", "Recife, PE", "Brasília, DF",
    "Campinas, SP", "Florianópolis, SC", "Joinville, SC", "Natal, RN", "Goiânia, GO",
    "São José dos Campos, SP", "Maceió, AL", "Aracaju, SE", "Manaus, AM", "Belém, PA",
    "Vitória, ES", "São Luís, MA", "Campo Grande, MS", "Teresina, PI", "Cuiabá, MT"
]

platforms = ["LinkedIn", "Indeed", "Glassdoor", "Gupy", "InfoJobs", "Carreira", "Catho"]
modalities = ["Remoto", "Híbrido", "Presencial", "Flexível"]
categories = ["Software", "Dados", "Design", "Infraestrutura", "Produto", "Marketing", "Operações"]
contracts = ["CLT", "PJ", "Estágio", "Temporário"]
levels = ["Junior", "Pleno", "Senior", "Especialista", "Tech Lead"]

templates = [
    {
        "title": "Desenvolvedor Backend Senior",
        "salary": (9500, 22000),
        "description": "Atuar no desenvolvimento de APIs, integrações e serviços críticos para produtos digitais de alta escala.",
        "requirements": [
            "Experiência com Python, Flask ou FastAPI.",
            "Conhecimento de APIs REST e bancos relacionais.",
            "Domínio de testes automatizados e versionamento com Git.",
            "Boa comunicação e trabalho em equipe."
        ],
        "benefits": "Vale alimentação, vale refeição, plano de saúde, home office e treinamento contínuo."
    },
    {
        "title": "Engenheiro de Dados",
        "salary": (8500, 19000),
        "description": "Responsável por coletar, transformar e disponibilizar dados para análise e negócio com alta qualidade.",
        "requirements": [
            "Experiência com SQL e modelagem de dados.",
            "Conhecimento em ETL e pipelines de dados.",
            "Uso de Python para automação e transformação de dados.",
            "Familiaridade com cloud e qualidade de dados."
        ],
        "benefits": "Plano odontológico, bônus por desempenho, ambiente híbrido e suporte para certificações."
    },
    {
        "title": "Product Manager",
        "salary": (12000, 26000),
        "description": "Definir prioridades, validar hipóteses e alinhar entregas com clientes, design e engenharia.",
        "requirements": [
            "Experiência com gestão de produtos digitais.",
            "Capacidade de priorização e análise de métricas.",
            "Boa comunicação com stakeholders.",
            "Conhecimento de metodologias ágeis."
        ],
        "benefits": "Plano de saúde, bônus anual, flexibilidade e desenvolvimento profissional."
    },
    {
        "title": "Analista de QA",
        "salary": (6000, 15000),
        "description": "Garantir a qualidade de software por meio de testes funcionais, automatizados e análise de regressão.",
        "requirements": [
            "Experiência em testes de API e UI.",
            "Conhecimento em Cypress, Playwright ou Selenium.",
            "Habilidade de criar cenários de teste e relatar defeitos.",
            "Boa documentação e organização."
        ],
        "benefits": "Vale alimentação, jornada flexível e parceria com academia."
    },
    {
        "title": "DevOps Engineer",
        "salary": (11000, 24000),
        "description": "Manter infraestrutura em nuvem, pipelines e automações para garantir disponibilidade e escalabilidade.",
        "requirements": [
            "Experiência com Docker, Kubernetes e Terraform.",
            "Conhecimento em CI/CD e monitoramento de serviços.",
            "Familiaridade com AWS, GCP ou Azure.",
            "Visão de segurança e observabilidade."
        ],
        "benefits": "Home office, plano de saúde, participação nos lucros e incentivo a certificações."
    },
    {
        "title": "UI/UX Designer",
        "salary": (7000, 18000),
        "description": "Criar interfaces intuitivas e experiências consistentes para usuários e produto digital.",
        "requirements": [
            "Domínio de Figma e design systems.",
            "Experiência em pesquisa e prototipagem de interfaces.",
            "Conhecimento de usabilidade e acessibilidade.",
            "Capacidade de negociar com stakeholders e produto."
        ],
        "benefits": "Vale refeição, ambiente criativo, workshops internos e oportunidade de atuar em projetos globais."
    },
    {
        "title": "Analista de Dados",
        "salary": (6500, 16000),
        "description": "Transformar dados em insights claros para apoiar decisões de negócio e operações.",
        "requirements": [
            "Experiência com Power BI ou Tableau.",
            "Boa análise de dados e storytelling.",
            "Conhecimento em SQL e modelagem analítica.",
            "Visão estratégica e comunicação."
        ],
        "benefits": "Bônus por metas, desenvolvimento técnico e flexibilidade de horário."
    },
    {
        "title": "Especialista em Segurança da Informação",
        "salary": (13000, 28000),
        "description": "Aplicar boas práticas de segurança, governança e monitoramento para proteger sistemas e dados.",
        "requirements": [
            "Experiência com segurança em cloud e análise de vulnerabilidades.",
            "Conhecimento de IAM, firewalls e políticas de acesso.",
            "Domínio de compliance e incident response.",
            "Boa capacidade analítica e documentação."
        ],
        "benefits": "Vale alimentação, plano de saúde, participação nos lucros e certificações pagas."
    },
    {
        "title": "Mobile Developer",
        "salary": (9000, 21000),
        "description": "Desenvolver soluções mobile com foco em qualidade, performance e experiência do usuário.",
        "requirements": [
            "Experiência em React Native ou Flutter.",
            "Conhecimento de navegação, estado e integrações nativas.",
            "Boa atenção a performance e arquitetura.",
            "Familiaridade com versionamento e entrega contínua."
        ],
        "benefits": "Home office, vale refeição, ambiente dinâmico e equipamentos modernos."
    },
    {
        "title": "Frontend Engineer",
        "salary": (8500, 19500),
        "description": "Construir interfaces robustas, performáticas e acessíveis para produtos digitais de alto impacto.",
        "requirements": [
            "Experiência com React, TypeScript e componentização.",
            "Conhecimento em HTML, CSS e design responsivo.",
            "Capacidade de escrever código limpo e reutilizável.",
            "Familiaridade com testes e integração contínua."
        ],
        "benefits": "Vale refeição, reforço pedagógico, plano de saúde e ambiente híbrido."
    }
]

used = set()

for idx in range(TOTAL_JOBS):
    template = templates[idx % len(templates)]
    company = companies[idx % len(companies)]
    location = locations[idx % len(locations)]
    platform = platforms[idx % len(platforms)]
    modality = modalities[idx % len(modalities)]
    category = categories[idx % len(categories)]
    contract = contracts[idx % len(contracts)]
    level = levels[idx % len(levels)]
    salary_min, salary_max = template["salary"]
    salary = round(random.uniform(salary_min, salary_max), 2)

    title = template["title"]
    title_key = f"{company}:{title}"
    while title_key in used:
        title = f"{title} {idx + 1}"
        title_key = f"{company}:{title}"
    used.add(title_key)

    summary = template["description"]
    if idx % 3 == 0:
        summary += " Valorizamos autonomia, qualidade e colaboração entre times."
    elif idx % 3 == 1:
        summary += " O time trabalha em projetos com impacto real para clientes e usuários."
    else:
        summary += " Buscamos alguém apaixonado por construir produtos de alta qualidade e performance."

    requirements = list(template["requirements"])
    if idx % 2 == 0:
        requirements.append("Capacidade de aprender rapidamente e trabalhar em ambiente dinâmico.")
    if idx % 4 == 0:
        requirements.append("Experiência com metodologias ágeis e colaboração com times multidisciplinares.")

    job = {
        "title": title,
        "description": summary,
        "company": company,
        "location": location,
        "url": f"https://{company.lower().replace(' ', '-').replace('.', '')}.{title.lower().replace(' ', '-')}.jobs/{idx + 1}",
        "platform": platform,
        "salary": salary,
        "modality": modality,
        "category": category,
        "contract": contract,
        "level": level,
        "requirements": requirements[:5],
        "benefits": template["benefits"],
        "tempo": "Full time" if idx % 2 == 0 else "Part time",
    }

    print(json.dumps(job, ensure_ascii=False))
PY
)

printf '\nResumo: %s vagas processadas, %s criadas, %s falhas.\n' "$processed" "$created" "$failed"
printf 'Endpoint: %s\n' "$API_BASE_URL"
