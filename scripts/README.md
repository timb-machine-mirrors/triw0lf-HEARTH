# HEARTH Scripts Documentation

## Overview

The HEARTH scripts directory contains a comprehensive suite of Python tools for processing, validating, and managing threat hunting content. The codebase has been completely refactored with enterprise-grade features including error handling, logging, caching, validation, and testing.

## Architecture

### Core Components

#### 1. **Configuration Management** (`config_manager.py`)
- Centralized configuration with environment variable overrides
- JSON-based configuration files
- Singleton pattern for global access
- Type-safe configuration with dataclasses

```python
from config_manager import get_config
config = get_config().config
print(config.base_directory)
```

#### 2. **Logging System** (`logger_config.py`)
- Structured logging with multiple handlers
- File and console output with different formats
- Configurable log levels
- Singleton logger instance

```python
from logger_config import get_logger
logger = get_logger()
logger.info(\"Processing hunt files\")
```

#### 3. **Input Validation** (`validators.py`)
- Comprehensive validation for hunt data
- URL, file path, and format validation
- MITRE ATT&CK tactic validation
- Security-focused input sanitization

```python
from validators import HuntValidator
validator = HuntValidator()
validator.validate_hunt_id('H001', 'Flames')
```

#### 4. **Caching System** (`cache_manager.py`)
- File-based and memory caching
- TTL (Time To Live) support
- File modification detection
- Decorator-based caching

```python
from cache_manager import cached

@cached(ttl=3600)
def expensive_operation(data):
    return process_data(data)
```

#### 5. **Hunt Parser** (`hunt_parser.py`)
- Object-oriented hunt file processing
- Multiple export formats (JSON, JavaScript)
- Comprehensive error handling
- Statistics generation

```python
from hunt_parser import HuntProcessor
processor = HuntProcessor()
hunts = processor.process_all_hunts()
```

### Utility Modules

#### **Hunt Parser Utils** (`hunt_parser_utils.py`)
Shared utilities for markdown parsing, file discovery, and data extraction.

#### **Exception Handling** (`exceptions.py`)
Custom exception classes for different error types:
- `FileProcessingError`
- `MarkdownParsingError`
- `ValidationError`
- `ConfigurationError`
- `AIAnalysisError`

## Features

### 🔍 **Enhanced Error Handling**
- Comprehensive exception hierarchy
- Graceful error recovery
- Detailed error logging with context
- User-friendly error messages

### ⚡ **Performance Optimizations**
- Multi-level caching (memory + disk)
- Lazy loading of resources
- Efficient data structures
- Debounced operations

### 🛡️ **Security & Validation**
- Input sanitization and validation
- Path traversal protection
- URL validation
- Secure file handling

### 🔧 **Configuration Management**
- Environment-based configuration
- JSON configuration files
- Runtime configuration updates
- Type-safe configuration objects

### 📊 **Monitoring & Observability**
- Structured logging
- Performance metrics
- Cache statistics
- Processing statistics

### 🧪 **Testing Framework**
- Comprehensive unit tests
- Integration tests
- Mock-based testing
- Test coverage for all components

## Usage Examples

### Basic Hunt Processing

```python
from hunt_parser import HuntProcessor
from logger_config import get_logger

logger = get_logger()
processor = HuntProcessor()

try:
    # Process all hunt files
    hunts = processor.process_all_hunts()
    
    # Export to JavaScript format
    processor.export_hunts(hunts)
    
    # Generate statistics
    stats = processor.generate_statistics(hunts)
    processor.print_statistics(stats)
    
except Exception as error:
    logger.error(f\"Processing failed: {error}\")
```

### Custom Configuration

```python
from config_manager import get_config

config_manager = get_config()

# Update configuration
config_manager.update_config(
    base_directory=\"/custom/path\",
    max_hunts_for_comparison=20
)

# Save configuration
config_manager.save_config(\"custom_config.json\")
```

### Validation

```python
from validators import HuntValidator

validator = HuntValidator()

# Validate hunt data
hunt_data = {
    'id': 'H001',
    'category': 'Flames',
    'title': 'Test Hunt',
    'tactic': 'Execution'
}

validated_data = validator.validate_hunt_data(hunt_data)
```

### Caching

```python
from cache_manager import get_cache_manager

cache = get_cache_manager()

# Manual caching
cache.set('key', data, file_path='source.md')
cached_data = cache.get('key')

# Decorator caching
@cached(ttl=1800)
def process_file(file_path):
    return expensive_processing(file_path)
```

## Scripts

### 1. **parse_hunts.py** (Legacy - Use hunt_parser.py)
Original hunt parsing script, maintained for backward compatibility.

### 2. **hunt_parser.py** (Recommended)
Enhanced object-oriented hunt parser with full feature set.

```bash
python3 scripts/hunt_parser.py
```

### 3. **generate_leaderboard.py**
Generates contributor leaderboard from hunt submissions.

```bash
python3 scripts/generate_leaderboard.py
```

### 4. **duplicate_detection.py**
AI-powered duplicate detection for hunt submissions.

### 5. **test_runner.py**
Comprehensive test suite for all components.

```bash
python3 scripts/test_runner.py
```

## Configuration

### Environment Variables

```bash
# Base configuration
export HEARTH_BASE_DIR=\"/path/to/hearth\"
export HEARTH_OUTPUT_DIR=\"/path/to/output\"

# Processing settings
export HEARTH_MAX_COMPARISON_HUNTS=15
export HEARTH_SIMILARITY_THRESHOLD=0.8

# AI settings
export OPENAI_MODEL=\"gpt-4\"
export OPENAI_API_KEY=\"your-api-key\"

# GitHub settings
export GITHUB_REPO_URL=\"https://github.com/your/repo\"
export GITHUB_BRANCH=\"main\"
```

### Configuration File (hearth_config.json)

```json
{
  \"base_directory\": \".\",
  \"hunt_directories\": [\"Flames\", \"Embers\", \"Alchemy\"],
  \"output_directory\": \".\",
  \"max_hunts_for_comparison\": 10,
  \"similarity_threshold\": 0.7,
  \"hunts_data_filename\": \"hunts-data.js\",
  \"contributors_filename\": \"Keepers/Contributors.md\"
}
```

## Testing

Run the complete test suite:

```bash
python3 scripts/test_runner.py
```

Run specific test categories:

```bash
python3 -m unittest scripts.test_runner.TestHuntValidator
python3 -m unittest scripts.test_runner.TestCacheManager
```

## Performance Monitoring

### Cache Statistics

```python
from cache_manager import get_cache_manager

cache = get_cache_manager()
stats = cache.get_cache_stats()
print(f\"Cache entries: {stats['memory_entries']}\")
print(f\"Cache size: {stats['total_size_bytes']} bytes\")
```

### Processing Statistics

```python
processor = HuntProcessor()
hunts = processor.process_all_hunts()
stats = processor.generate_statistics(hunts)

print(f\"Total hunts: {stats['total_hunts']}\")
print(f\"Categories: {stats['category_counts']}\")
```

## Error Handling Best Practices

1. **Always use try-catch blocks** for file operations
2. **Log errors with context** using the centralized logger
3. **Use specific exception types** for different error conditions
4. **Provide meaningful error messages** for users
5. **Implement graceful degradation** when possible

## Contributing

1. Follow the established architecture patterns
2. Add comprehensive tests for new features
3. Use type hints for all function signatures
4. Document new configuration options
5. Update this README for new features

## Migration Guide

### From Legacy Scripts

If you're migrating from the original scripts:

1. **Replace parse_hunts.py usage:**
   ```python
   # Old
   from parse_hunts import main
   main()
   
   # New
   from hunt_parser import HuntProcessor
   processor = HuntProcessor()
   processor.process_all_hunts()
   ```

2. **Update configuration:**
   - Move hardcoded values to configuration files
   - Use environment variables for sensitive data

3. **Add error handling:**
   - Wrap operations in try-catch blocks
   - Use the centralized logger

4. **Enable caching:**
   - Add @cached decorators to expensive functions
   - Use cache.get/set for manual caching

## Troubleshooting

### Common Issues

1. **Import Errors:**
   - Ensure scripts directory is in Python path
   - Check for missing dependencies

2. **File Permission Errors:**
   - Verify read/write permissions on directories
   - Check cache directory permissions

3. **Configuration Issues:**
   - Validate JSON configuration syntax
   - Check environment variable names

4. **Performance Issues:**
   - Monitor cache hit rates
   - Check log files for bottlenecks
   - Use profiling tools for optimization

### Debug Mode

Enable debug logging:

```python
import logging
logging.getLogger('hearth').setLevel(logging.DEBUG)
```

## Dependencies

- Python 3.8+
- pathlib (built-in)
- json (built-in)
- re (built-in)
- typing (built-in)
- dataclasses (built-in)
- unittest (built-in)

Optional:
- openai (for AI analysis)
- python-dotenv (for environment variables)

---

This documentation reflects the enhanced architecture and provides comprehensive guidance for using the improved HEARTH scripts system.