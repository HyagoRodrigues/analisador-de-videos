# Analisador de Vídeos YouTube - Aplicação Web

Uma aplicação web moderna para análise e transcrição de vídeos do YouTube, construída com Next.js e React.

## 🚀 Funcionalidades

- **Interface Web Intuitiva**: Interface moderna e responsiva
- **Transcrição Automática**: Usa Whisper AI para transcrever vídeos
- **Resumo Inteligente**: Gera resumos automáticos do conteúdo
- **Download de Documentos**: Baixe a análise em formato DOCX
- **Processamento em Tempo Real**: Acompanhe o progresso da análise

## 📋 Pré-requisitos

### Software Necessário
- **Node.js** (versão 18 ou superior)
- **Python** (versão 3.8 ou superior)
- **FFmpeg** (para processamento de áudio)

### Dependências Python
```bash
pip install whisper yt-dlp python-docx tqdm
```

### FFmpeg
1. Baixe o FFmpeg de [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extraia os arquivos `ffmpeg.exe`, `ffplay.exe` e `ffprobe.exe`
3. Coloque-os na pasta raiz do projeto

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/HyagoRodrigues/analisador-de-videos.git
cd analisador-de-videos
```

2. **Instale as dependências Node.js**
```bash
npm install
```

3. **Instale as dependências Python**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

5. **Baixe e configure o FFmpeg**
   - Baixe os executáveis do FFmpeg
   - Coloque `ffmpeg.exe`, `ffplay.exe` e `ffprobe.exe` na pasta raiz

## 🚀 Executando a Aplicação

### Modo Desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Modo Produção
```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts          # API para análise de vídeos
│   │   ├── globals.css               # Estilos globais
│   │   ├── layout.tsx                # Layout principal
│   │   └── page.tsx                  # Página inicial
│   └── components/                   # Componentes React (futuro)
├── temp/                             # Arquivos temporários
├── youtube_analyzer.py               # Script Python original
├── youtube_analyzer_web.py           # Script Python para web
├── requirements.txt                  # Dependências Python
├── package.json                      # Dependências Node.js
├── next.config.js                    # Configuração Next.js
├── tailwind.config.js                # Configuração Tailwind
└── tsconfig.json                     # Configuração TypeScript
```

## 🌐 Deploy na Vercel

### Preparação
1. **Instale a CLI da Vercel**
```bash
npm i -g vercel
```

2. **Configure o projeto**
```bash
vercel
```

3. **Configure as variáveis de ambiente na Vercel**
   - Acesse o dashboard da Vercel
   - Vá em Settings > Environment Variables
   - Adicione as variáveis do arquivo `.env.example`

### Limitações do Deploy
⚠️ **Importante**: O deploy na Vercel tem algumas limitações:

- **FFmpeg**: Não é possível incluir executáveis grandes
- **Python**: Requer configuração especial para dependências
- **Processamento**: Limitado a 10 segundos por função

### Alternativas para Deploy

1. **Vercel com API Externa**
   - Deploy apenas do frontend na Vercel
   - API Python em serviço separado (Railway, Render, etc.)

2. **Railway** (Recomendado)
   - Suporte completo a Python e FFmpeg
   - Deploy direto do repositório

3. **Render**
   - Suporte a aplicações full-stack
   - Configuração via `render.yaml`

## 🔧 Configuração para Produção

### Otimizações
- Modelo Whisper menor para produção (`tiny` ou `base`)
- Cache de modelos ML
- Compressão de arquivos temporários
- Rate limiting na API

### Variáveis de Ambiente
```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="Analisador de Vídeos"
PYTHON_PATH=/usr/bin/python3
WHISPER_MODEL=base
MAX_FILE_SIZE=50MB
```

## 🐛 Solução de Problemas

### Erro: FFmpeg não encontrado
- Verifique se os executáveis estão na pasta raiz
- Confirme as permissões de execução

### Erro: Modelo Whisper não carrega
- Verifique a instalação do PyTorch
- Tente um modelo menor (`tiny`)

### Erro: Timeout na API
- Vídeos muito longos podem exceder o limite
- Configure timeout maior ou processe em chunks

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a seção de [Solução de Problemas](#-solução-de-problemas)
2. Abra uma [Issue](https://github.com/HyagoRodrigues/analisador-de-videos/issues)
3. Entre em contato através do GitHub

---

**Desenvolvido com ❤️ usando Next.js, React, Python e Whisper AI**