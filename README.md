# Analisador de Vídeos do YouTube

Este projeto permite baixar vídeos do YouTube, extrair o áudio, transcrever o conteúdo usando o modelo Whisper e salvar a transcrição em um arquivo DOCX formatado.

## Requisitos

- Python 3.8 ou superior
- FFmpeg (não incluído no repositório - veja instruções de instalação abaixo)
- Bibliotecas Python (listadas em requirements.txt)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/HyagoRodrigues/analisador-de-videos.git
cd analisador-de-videos
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Baixe o FFmpeg:
   - Acesse o site oficial do FFmpeg: https://ffmpeg.org/download.html
   - Baixe a versão para Windows: "Windows builds from gyan.dev"
   - Extraia os arquivos e copie `ffmpeg.exe`, `ffplay.exe` e `ffprobe.exe` para a pasta raiz do projeto
   - **Importante**: Estes arquivos são grandes e não estão incluídos no repositório Git

## Uso

Execute o script principal:
```bash
python youtube_analyzer.py
```

O programa irá:
1. Solicitar a URL de um vídeo do YouTube
2. Baixar o vídeo e extrair o áudio
3. Transcrever o áudio usando o modelo Whisper
4. Salvar a transcrição em um arquivo DOCX formatado

## Funcionalidades

- Download de vídeos do YouTube
- Extração de áudio
- Transcrição automática usando IA (modelo Whisper)
- Formatação e salvamento em documento Word

## Estrutura do Projeto

- `youtube_analyzer.py`: Script principal
- `temp/`: Diretório para arquivos temporários

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.